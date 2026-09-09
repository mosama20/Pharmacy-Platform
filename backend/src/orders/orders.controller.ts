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
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateCourierLocationDto } from './dto/orders.dto';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly trackingService: TrackingService,
  ) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  async createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    if (user) {
      dto.customerId = user.id;
      dto.customerName = user.name || dto.customerName;
      dto.customerPhone = user.phone || dto.customerPhone;
      dto.customerEmail = user.email || dto.customerEmail;
    }
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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('format') format?: string,
    @Query('paginated') paginated?: string,
  ) {
    const courierId = user?.role === 'DELIVERY' ? user.id : undefined;

    return this.ordersService.findAll({
      status,
      deliveryType,
      paymentMethod,
      search,
      courierId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      format,
      paginated: paginated !== undefined ? paginated === 'true' || paginated === '1' : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  async getMyOrders(@CurrentUser() user: any) {
    return this.ordersService.findByCustomer(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/live-tracking')
  async getLiveTracking(@Param('id') id: string, @CurrentUser() user: any) {
    return this.trackingService.getLiveTracking(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOneOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.findOne(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(id, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/location')
  async updateLocation(
    @Param('id') id: string,
    @Body() dto: UpdateCourierLocationDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateCourierLocation(id, dto.lat, dto.lng, user);
  }
}

