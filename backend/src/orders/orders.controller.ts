import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly trackingService: TrackingService,
  ) {}

  @Post()
  async createOrder(@Body() dto: any) {
    return this.ordersService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST', 'DELIVERY', 'SUPPORT')
  @Get('dashboard-stats')
  async getDashboardStats() {
    return this.ordersService.getDashboardStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DELIVERY', 'ADMIN')
  @Get('courier-stats')
  async getCourierStats(@CurrentUser() user: any) {
    return this.ordersService.getCourierStats(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DELIVERY', 'ADMIN')
  @Get('my-deliveries')
  async getMyDeliveries(@CurrentUser() user: any) {
    return this.ordersService.findByCourier(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST', 'DELIVERY', 'SUPPORT')
  @Get()
  async getAllOrders(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('deliveryType') deliveryType?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('search') search?: string,
  ) {
    const courierId = user?.role === 'DELIVERY' ? user.id : undefined;

    return this.ordersService.findAll({
      status,
      deliveryType,
      paymentMethod,
      search,
      courierId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  async getMyOrders(@CurrentUser() user: any) {
    return this.ordersService.findByCustomer(user.id);
  }

  @Get(':id/live-tracking')
  async getLiveTracking(@Param('id') id: string) {
    return this.trackingService.getLiveTracking(id);
  }

  @Get(':id')
  async getOneOrder(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST', 'DELIVERY')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(id, dto, user);
  }
}

