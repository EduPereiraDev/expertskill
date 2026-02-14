import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private isConnected = false;

  // TTL em segundos para cada tipo de dado
  private readonly TTL = {
    UPCOMING_EVENTS: 30,      // Eventos próximos - 30s (muda frequentemente)
    INPLAY_EVENTS: 10,        // Eventos ao vivo - 10s (placar muda rápido)
    EVENT_ODDS: 15,           // Odds de evento - 15s
    EVENT_STATS: 300,         // Stats de evento - 5min (histórico não muda)
    PLAYER_STATS: 600,        // Stats de jogador - 10min
    LEAGUES: 3600,            // Ligas disponíveis - 1h
    ENDED_EVENTS: 60,         // Eventos finalizados - 1min
  };

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (!redisUrl) {
      this.logger.warn('REDIS_URL não configurado - cache desabilitado');
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      await this.redis.connect();
      this.isConnected = true;
      this.logger.log('Redis conectado - Cache habilitado');

      this.redis.on('error', (err) => {
        this.logger.error('Redis error:', err.message);
        this.isConnected = false;
      });

      this.redis.on('reconnecting', () => {
        this.logger.log('Redis reconectando...');
      });

      this.redis.on('ready', () => {
        this.isConnected = true;
        this.logger.log('Redis pronto');
      });
    } catch (error) {
      this.logger.error('Falha ao conectar Redis:', error);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis desconectado');
    }
  }

  private isAvailable(): boolean {
    return this.redis !== null && this.isConnected;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;

    try {
      const data = await this.redis!.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    } catch (error) {
      this.logger.error(`Cache GET error [${key}]:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis!.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis!.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Cache SET error [${key}]:`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.redis!.del(key);
    } catch (error) {
      this.logger.error(`Cache DEL error [${key}]:`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const keys = await this.redis!.keys(pattern);
      if (keys.length > 0) {
        await this.redis!.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Cache DEL pattern error [${pattern}]:`, error);
    }
  }

  // Métodos específicos para BetsAPI com TTL apropriado
  async getUpcomingEvents<T>(): Promise<T | null> {
    return this.get<T>('betsapi:upcoming');
  }

  async setUpcomingEvents(data: any): Promise<void> {
    await this.set('betsapi:upcoming', data, this.TTL.UPCOMING_EVENTS);
  }

  async getInplayEvents<T>(): Promise<T | null> {
    return this.get<T>('betsapi:inplay');
  }

  async setInplayEvents(data: any): Promise<void> {
    await this.set('betsapi:inplay', data, this.TTL.INPLAY_EVENTS);
  }

  async getEventOdds<T>(eventId: string): Promise<T | null> {
    return this.get<T>(`betsapi:odds:${eventId}`);
  }

  async setEventOdds(eventId: string, data: any): Promise<void> {
    await this.set(`betsapi:odds:${eventId}`, data, this.TTL.EVENT_ODDS);
  }

  async getEventStats<T>(eventId: string): Promise<T | null> {
    return this.get<T>(`betsapi:stats:${eventId}`);
  }

  async setEventStats(eventId: string, data: any): Promise<void> {
    await this.set(`betsapi:stats:${eventId}`, data, this.TTL.EVENT_STATS);
  }

  async getPlayerStats<T>(playerId: string): Promise<T | null> {
    return this.get<T>(`betsapi:player:${playerId}`);
  }

  async setPlayerStats(playerId: string, data: any): Promise<void> {
    await this.set(`betsapi:player:${playerId}`, data, this.TTL.PLAYER_STATS);
  }

  async getLeagues<T>(): Promise<T | null> {
    return this.get<T>('betsapi:leagues');
  }

  async setLeagues(data: any): Promise<void> {
    await this.set('betsapi:leagues', data, this.TTL.LEAGUES);
  }

  async getEndedEvents<T>(): Promise<T | null> {
    return this.get<T>('betsapi:ended');
  }

  async setEndedEvents(data: any): Promise<void> {
    await this.set('betsapi:ended', data, this.TTL.ENDED_EVENTS);
  }

  // Estatísticas de cache
  async getStats(): Promise<{ hits: number; misses: number; keys: number } | null> {
    if (!this.isAvailable()) return null;

    try {
      const info = await this.redis!.info('stats');
      const keys = await this.redis!.dbsize();
      
      const hitsMatch = info.match(/keyspace_hits:(\d+)/);
      const missesMatch = info.match(/keyspace_misses:(\d+)/);

      return {
        hits: hitsMatch ? parseInt(hitsMatch[1]) : 0,
        misses: missesMatch ? parseInt(missesMatch[1]) : 0,
        keys,
      };
    } catch {
      return null;
    }
  }
}
