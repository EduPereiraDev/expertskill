import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { BetsapiService } from './betsapi.service';
import { BetsapiController } from './betsapi.controller';
import { BetsapiSyncService } from './betsapi-sync.service';
import { BetsapiSyncController } from './betsapi-sync.controller';
import { Bet365Service } from './bet365.service';
import { Bet365Controller } from './bet365.controller';
import { Bet365SyncService } from './bet365-sync.service';
import { Bet365SyncController } from './bet365-sync.controller';
import { MarketAnalysisService } from './market-analysis.service';
import { MarketAnalysisController } from './market-analysis.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 5,
    }),
    ConfigModule,
    PrismaModule,
  ],
  controllers: [
    BetsapiController, 
    BetsapiSyncController, 
    Bet365Controller,
    Bet365SyncController,
    MarketAnalysisController,
  ],
  providers: [
    BetsapiService, 
    BetsapiSyncService, 
    Bet365Service,
    Bet365SyncService,
    MarketAnalysisService,
  ],
  exports: [
    BetsapiService, 
    BetsapiSyncService, 
    Bet365Service,
    Bet365SyncService,
    MarketAnalysisService,
  ],
})
export class BetsapiModule {}
