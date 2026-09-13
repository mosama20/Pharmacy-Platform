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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CmsService } from './cms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CreateBannerDto,
  UpdateBannerDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  ValidatePromoCodeDto,
  CreatePromoCodeDto,
  UpdatePromoCodeDto,
  CreateArticleDto,
  UpdateArticleDto,
  UpdateSettingsDto,
} from './dto/cms.dto';

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
  createBanner(@Body() body: CreateBannerDto) {
    return this.cmsService.createBanner(body);
  }

  @Put('banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  updateBanner(@Param('id') id: string, @Body() body: UpdateBannerDto) {
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
  createCategory(@Body() body: CreateCategoryDto) {
    return this.cmsService.createCategory(body);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  updateCategory(@Param('id') id: string, @Body() body: UpdateCategoryDto) {
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
  validatePromoCode(@Body() body: ValidatePromoCodeDto) {
    return this.cmsService.validatePromoCode(body.code, body.cartTotal, body.items);
  }

  @Post('promo-codes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  createPromoCode(@Body() body: CreatePromoCodeDto) {
    return this.cmsService.createPromoCode({
      ...body,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });
  }

  @Put('promo-codes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  updatePromoCode(@Param('id') id: string, @Body() body: UpdatePromoCodeDto) {
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
  createArticle(@Body() body: CreateArticleDto) {
    return this.cmsService.createArticle({
      ...body,
      isFeatured: body.isFeatured !== undefined ? body.isFeatured : false,
    });
  }

  @Put('articles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  updateArticle(@Param('id') id: string, @Body() body: UpdateArticleDto) {
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
  @Roles('ADMIN')
  @UsePipes(new ValidationPipe({ whitelist: false, transform: true, forbidNonWhitelisted: false }))
  updateSettings(@Body() body: UpdateSettingsDto) {
    return this.cmsService.updateSettings(body);
  }
}
