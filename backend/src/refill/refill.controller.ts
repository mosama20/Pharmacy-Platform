import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { RefillService } from './refill.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('refill')
export class RefillController {
  constructor(private readonly refillService: RefillService) {}

  @Get()
  async getAll() {
    return this.refillService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyRefills(@CurrentUser() user: any) {
    return this.refillService.findByCustomer(user.id);
  }

  @Post()
  async create(@Body() dto: any) {
    return this.refillService.create(dto);
  }

  @Patch(':id/toggle')
  async toggleStatus(@Param('id') id: string) {
    return this.refillService.toggleStatus(id);
  }
}
