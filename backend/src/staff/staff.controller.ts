import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StaffService, CreateStaffDto } from './staff.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Roles('ADMIN', 'PHARMACIST')
  @Get()
  async getAllStaff(@Query('role') role?: string) {
    return this.staffService.findAllStaff(role);
  }

  @Roles('ADMIN')
  @Post()
  async createStaff(@Body() dto: CreateStaffDto) {
    return this.staffService.createStaff(dto);
  }

  @Roles('ADMIN')
  @Put(':id')
  async updateStaff(
    @Param('id') id: string,
    @Body()
    dto: Partial<CreateStaffDto> & { status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' },
  ) {
    return this.staffService.updateStaff(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async deleteStaff(@Param('id') id: string) {
    return this.staffService.deleteStaff(id);
  }
}
