import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CmsService } from './cms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('cms')
export class CmsController {
  constructor(private cmsService: CmsService) {}

  // --- Banners ---
  @Get('banners')
  getBanners(@Query('activeOnly') activeOnly?: string) {
    return this.cmsService.getBanners(activeOnly === 'true');
  }

  @Post('banners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  createBanner(@Body() body: any) {
    return this.cmsService.createBanner(body);
  }

  @Put('banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  updateBanner(@Param('id') id: string, @Body() body: any) {
    return this.cmsService.updateBanner(id, body);
  }

  @Delete('banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  deleteBanner(@Param('id') id: string) {
    return this.cmsService.deleteBanner(id);
  }

  // --- Categories ---
  @Get('categories')
  getCategories() {
    return this.cmsService.getCategories();
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  createCategory(@Body() body: any) {
    return this.cmsService.createCategory(body);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  updateCategory(@Param('id') id: string, @Body() body: any) {
    return this.cmsService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  deleteCategory(@Param('id') id: string) {
    return this.cmsService.deleteCategory(id);
  }

  // --- Promo Codes ---
  @Get('promo-codes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST', 'SUPPORT')
  getPromoCodes() {
    return this.cmsService.getPromoCodes();
  }

  @Post('promo-codes/validate')
  validatePromoCode(@Body() body: { code: string; cartTotal: number }) {
    return this.cmsService.validatePromoCode(body.code, body.cartTotal);
  }

  @Post('promo-codes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  createPromoCode(@Body() body: any) {
    return this.cmsService.createPromoCode(body);
  }

  @Put('promo-codes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  updatePromoCode(@Param('id') id: string, @Body() body: any) {
    return this.cmsService.updatePromoCode(id, body);
  }

  @Delete('promo-codes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  deletePromoCode(@Param('id') id: string) {
    return this.cmsService.deletePromoCode(id);
  }

  // --- Articles ---
  @Get('articles')
  getArticles() {
    return this.cmsService.getArticles();
  }

  @Get('articles/:id')
  getArticleById(@Param('id') id: string) {
    return this.cmsService.getArticleById(id);
  }

  @Post('articles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  createArticle(@Body() body: any) {
    return this.cmsService.createArticle(body);
  }

  @Put('articles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  updateArticle(@Param('id') id: string, @Body() body: any) {
    return this.cmsService.updateArticle(id, body);
  }

  @Delete('articles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  deleteArticle(@Param('id') id: string) {
    return this.cmsService.deleteArticle(id);
  }

  // --- Platform Settings ---
  @Get('settings')
  getSettings() {
    return this.cmsService.getSettings();
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  updateSettings(@Body() body: any) {
    return this.cmsService.updateSettings(body);
  }
}
