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
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly rxService: PrescriptionsService) {}

  @Post('upload')
  async upload(@Body() dto: any) {
    return this.rxService.uploadPrescription(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  @Get()
  async getAll(@Query('status') status?: string) {
    return this.rxService.findAll(status);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyPrescriptions(@CurrentUser() user: any) {
    return this.rxService.findByCustomer(user.id);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.rxService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  @Post(':id/quote')
  async quotePrescription(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    return this.rxService.quotePrescription(id, user.name, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: any,
  ) {
    return this.rxService.updateStatus(id, status);
  }
}
