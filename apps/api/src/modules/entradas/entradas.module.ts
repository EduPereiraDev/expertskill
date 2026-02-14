import { Module } from '@nestjs/common';
import { EntradasService } from './entradas.service';
import { EntradasController } from './entradas.controller';
import { RadarModule } from '../radar/radar.module';

@Module({
  imports: [RadarModule],
  controllers: [EntradasController],
  providers: [EntradasService],
  exports: [EntradasService],
})
export class EntradasModule {}
