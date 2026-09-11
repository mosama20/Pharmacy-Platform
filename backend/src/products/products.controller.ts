import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CreateProductDto,
  UpdateProductDto,
  ImportExcelDto,
  ImportDefaultDto,
} from './dto/products.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('subCategory') subCategory?: string,
    @Query('isHotDeal') isHotDeal?: string,
    @Query('isPrescriptionRequired') isPrescriptionRequired?: string,
    @Query('sortBy') sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'popular',
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('all') all?: string,
    @Query('format') format?: string,
    @Query('paginated') paginated?: string,
  ) {
    return this.productsService.findAll({
      search,
      category,
      subCategory,
      isHotDeal: isHotDeal !== undefined ? isHotDeal === 'true' : undefined,
      isPrescriptionRequired:
        isPrescriptionRequired !== undefined
          ? isPrescriptionRequired === 'true'
          : undefined,
      sortBy,
      limit: limit ? Number(limit) : undefined,
      page: page ? Number(page) : undefined,
      all: all !== undefined ? all === 'true' || all === '1' : undefined,
      format,
      paginated: paginated !== undefined ? paginated === 'true' || paginated === '1' : undefined,
    });
  }

  @Get('catalog-stats')
  async getCatalogStats() {
    return this.productsService.getCatalogStats();
  }

  @Get('categories')
  async getCategories() {
    return this.productsService.getCategories();
  }

  @Get('categories-tree')
  async getCategoriesTree() {
    return this.productsService.getCategoriesTree();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  @Get('template-excel')
  async downloadTemplate(@Res() res: Response) {
    const buffer = this.productsService.generateExcelTemplate();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="pharmacy_products_template.xlsx"',
    );
    return res.send(buffer);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('import-excel')
  async importExcel(@Body() body: ImportExcelDto) {
    const mode = body.mode || 'replace';

    if (body.filePath) {
      return this.productsService.importFromDefaultFile(body.filePath, mode);
    }

    if (body.base64) {
      // Remove data url prefix if present
      const cleanBase64 = body.base64.replace(/^data:.*?;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      return this.productsService.importFromExcelBuffer(buffer, mode);
    }

    const defaultPath = process.env.DEFAULT_EXCEL_PATH;
    if (defaultPath) {
      return this.productsService.importFromDefaultFile(defaultPath, mode);
    }

    throw new BadRequestException('يرجى تزويد ملف الإكسيل بصيغة Base64 أو تحديد مسار ملف صالح');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('import-default')
  async importDefault(@Body() body: ImportDefaultDto) {
    const defaultPath = process.env.DEFAULT_EXCEL_PATH;
    if (!defaultPath) {
      throw new BadRequestException('لم يتم ضبط مسار ملف الإكسيل الافتراضي في متغيرات البيئة (DEFAULT_EXCEL_PATH)');
    }
    return this.productsService.importFromDefaultFile(
      defaultPath,
      body.mode || 'replace',
    );
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  @Post()
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto as any);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  @Put(':id')
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto as any);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('clear-all')
  async clearAllProducts() {
    return this.productsService.clearAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PHARMACIST')
  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
