import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './modules/cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { BancaModule } from './modules/banca/banca.module';
import { RadarModule } from './modules/radar/radar.module';
import { EntradasModule } from './modules/entradas/entradas.module';
import { AnaliseModule } from './modules/analise/analise.module';
import { PagamentosModule } from './modules/pagamentos/pagamentos.module';
import { BetsapiModule } from './modules/betsapi/betsapi.module';
import { OddsMonitorModule } from './modules/odds-monitor/odds-monitor.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    CacheModule,
    AuthModule,
    BancaModule,
    RadarModule,
    EntradasModule,
    AnaliseModule,
    PagamentosModule,
    BetsapiModule,
    OddsMonitorModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    // C3: ThrottlerGuard aplicado globalmente
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
