import { Controller, Post, Get, Body, BadRequestException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test-telegram')
  async testTelegram(@Body() body: { token?: string; chatId?: string }) {
    const result = await this.notificationsService.testTelegram(body.token, body.chatId);
    if (!result.success) {
      throw new BadRequestException(result.error || 'فشل إرسال رسالة التليجرام التجريبية');
    }
    return {
      success: true,
      message: 'تم إرسال رسالة التليجرام بنجاح! تحقق من محادثة البوت على هاتفك.',
    };
  }

  @Post('test-email')
  async testEmail(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('يرجى تحديد البريد الإلكتروني المستهدف للاختبار');
    }
    const result = await this.notificationsService.testEmail(body.email);
    if (!result.success) {
      throw new BadRequestException(result.error || 'فشل إرسال البريد التجريبي');
    }
    return {
      success: true,
      message: 'تم إرسال البريد الإلكتروني التجريبي بنجاح!',
    };
  }

  @Get('telegram-bot-info')
  async getBotInfo() {
    return this.notificationsService.getTelegramBotStatus();
  }

  @Get('telegram-updates')
  async getUpdates() {
    return this.notificationsService.getTelegramUpdates();
  }
}
