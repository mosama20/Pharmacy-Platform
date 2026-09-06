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
import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

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
    @Body() dto: UpdateStaffDto,
    @CurrentUser() user: any,
  ) {
    return this.staffService.updateStaff(id, dto, user);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async deleteStaff(@Param('id') id: string, @CurrentUser() user: any) {
    return this.staffService.deleteStaff(id, user);
  }
}
