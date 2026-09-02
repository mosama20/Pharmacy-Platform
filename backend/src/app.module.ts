import { Module } from '@nestjs/common';
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

@Module({
  imports: [
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
  ],
  controllers: [AppController],
})
export class AppModule {}

