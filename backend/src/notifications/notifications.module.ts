import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { EmailService } from './email.service';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { DbModule } from '../database/db.module';

@Module({
  imports: [DbModule],
  controllers: [NotificationsController],
  providers: [TelegramService, EmailService, NotificationsService],
  exports: [NotificationsService, TelegramService, EmailService],
})
export class NotificationsModule {}
