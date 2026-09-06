import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('ADMIN')
  @Get()
  async getAllUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('q') query?: string,
  ) {
    return this.usersService.findAll(role, status, query);
  }

  @Roles('ADMIN', 'PHARMACIST', 'SUPPORT')
  @Get('customers')
  async getAllCustomers(@Query('q') query?: string) {
    return this.usersService.findAllCustomers(query);
  }

  @Roles('ADMIN', 'PHARMACIST', 'SUPPORT')
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Roles('ADMIN')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  ) {
    return this.usersService.updateStatus(id, status);
  }

  @Roles('ADMIN')
  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: 'ADMIN' | 'PHARMACIST' | 'DELIVERY' | 'SUPPORT' | 'CUSTOMER',
  ) {
    return this.usersService.updateRole(id, role);
  }

  @Roles('ADMIN')
  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body('password') password: string,
  ) {
    return this.usersService.resetPassword(id, password);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}

