import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { DbModule } from './database/db.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StaffModule } from './staff/staff.module';
import { ProductsModule } from './products/products.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { OrdersModule } from './orders/orders.module';
import { RefillModule } from './refill/refill.module';
import { CmsModule } from './cms/cms.module';
import { AiModule } from './ai/ai.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadsModule } from './uploads/uploads.module';
import { BackupModule } from './backup/backup.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 120, // 120 requests per minute general
      },
    ]),
    DbModule,
    AuthModule,
    UsersModule,
    StaffModule,
    ProductsModule,
    PrescriptionsModule,
    OrdersModule,
    RefillModule,
    CmsModule,
    AiModule,
    HealthModule,
    AuditModule,
    NotificationsModule,
    UploadsModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
