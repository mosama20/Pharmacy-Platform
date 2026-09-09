import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TrackingService } from './tracking.service';

import { PaymentService } from './payment.service';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService, TrackingService, PaymentService],
  exports: [OrdersService, TrackingService, PaymentService],
})
export class OrdersModule {}

