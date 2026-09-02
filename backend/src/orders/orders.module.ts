import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TrackingService } from './tracking.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, TrackingService],
  exports: [OrdersService, TrackingService],
})
export class OrdersModule {}

