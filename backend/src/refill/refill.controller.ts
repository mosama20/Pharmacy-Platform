import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { RefillService } from './refill.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateRefillDto } from './dto/refill.dto';

@Controller('refill')
export class RefillController {
  constructor(private readonly refillService: RefillService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  @Get()
  async getAll() {
    return this.refillService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyRefills(@CurrentUser() user: any) {
    return this.refillService.findByCustomer(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateRefillDto, @CurrentUser() user: any) {
    if (user) {
      dto.customerId = user.id;
      dto.customerName = user.name || dto.customerName;
      dto.customerPhone = user.phone || dto.customerPhone;
    }
    return this.refillService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/toggle')
  async toggleStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return this.refillService.toggleStatus(id, user);
  }
}
