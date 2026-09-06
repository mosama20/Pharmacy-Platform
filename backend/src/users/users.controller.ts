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
import { CurrentUser } from '../auth/current-user.decorator';
import {
  UpdateUserStatusDto,
  UpdateUserRoleDto,
  AdminResetPasswordDto,
} from './dto/users.dto';

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
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.updateStatus(id, dto.status, user);
  }

  @Roles('ADMIN')
  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.updateRole(id, dto.role, user);
  }

  @Roles('ADMIN')
  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.usersService.resetPassword(id, dto.password);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.deleteUser(id, user);
  }
}

