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
import {
  UploadPrescriptionDto,
  QuotePrescriptionDto,
  UpdatePrescriptionStatusDto,
} from './dto/prescriptions.dto';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly rxService: PrescriptionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  async upload(@Body() dto: UploadPrescriptionDto, @CurrentUser() user: any) {
    if (user) {
      dto.customerId = user.id;
      dto.customerName = user.name || dto.customerName;
      dto.customerPhone = user.phone || dto.customerPhone;
    }
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

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rxService.findOne(id, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  @Post(':id/quote')
  async quotePrescription(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: QuotePrescriptionDto,
  ) {
    return this.rxService.quotePrescription(id, user.name, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePrescriptionStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.rxService.updateStatus(id, dto.status as any, user);
  }
}
