import { Module } from '@nestjs/common';
import { OddsMonitorController } from './odds-monitor.controller';
import { OddsMonitorService } from './odds-monitor.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { BetsapiModule } from '../betsapi/betsapi.module';

@Module({
  imports: [PrismaModule, BetsapiModule],
  controllers: [OddsMonitorController],
  providers: [OddsMonitorService],
  exports: [OddsMonitorService],
})
export class OddsMonitorModule {}
