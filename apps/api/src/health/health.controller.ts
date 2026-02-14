import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../modules/cache/cache.service';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: { status: 'up' | 'down'; latency?: number; error?: string };
    redis: { status: 'up' | 'down' | 'disabled'; latency?: number; error?: string };
  };
}

@SkipThrottle()
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  async check(@Res() res: Response) {
    const result = await this.performHealthCheck();
    
    const httpStatus = result.status === 'healthy' 
      ? HttpStatus.OK 
      : result.status === 'degraded' 
        ? HttpStatus.OK 
        : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(httpStatus).json(result);
  }

  @Get('live')
  liveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  async readiness(@Res() res: Response) {
    const result = await this.performHealthCheck();
    
    if (result.checks.database.status === 'down') {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'not_ready',
        reason: 'Database unavailable',
      });
    }

    return res.status(HttpStatus.OK).json({ status: 'ready' });
  }

  private async performHealthCheck(): Promise<HealthCheckResult> {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
    };

    const allUp = checks.database.status === 'up';
    const redisDown = checks.redis.status === 'down';

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (!allUp) {
      status = 'unhealthy';
    } else if (redisDown) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      checks,
    };
  }

  private async checkDatabase(): Promise<{ status: 'up' | 'down'; latency?: number; error?: string }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latency: Date.now() - start };
    } catch (error: any) {
      return { status: 'down', error: error.message };
    }
  }

  private async checkRedis(): Promise<{ status: 'up' | 'down' | 'disabled'; latency?: number; error?: string }> {
    const start = Date.now();
    try {
      const stats = await this.cacheService.getStats();
      if (stats === null) {
        return { status: 'disabled' };
      }
      return { status: 'up', latency: Date.now() - start };
    } catch (error: any) {
      return { status: 'down', error: error.message };
    }
  }
}
