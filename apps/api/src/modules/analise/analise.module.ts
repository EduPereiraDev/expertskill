import { Module } from '@nestjs/common';
import { AnaliseController } from './analise.controller';
import { AnaliseService } from './analise.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { BetsapiModule } from '../betsapi/betsapi.module';

@Module({
  imports: [PrismaModule, BetsapiModule],
  controllers: [AnaliseController],
  providers: [AnaliseService],
  exports: [AnaliseService],
})
export class AnaliseModule {}
