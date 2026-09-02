import { Module } from '@nestjs/common';
import { RefillService } from './refill.service';
import { RefillController } from './refill.controller';

@Module({
  controllers: [RefillController],
  providers: [RefillService],
  exports: [RefillService],
})
export class RefillModule {}
