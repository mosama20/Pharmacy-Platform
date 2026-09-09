import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('upload')
export class UploadsController {
  constructor(private readonly storageService: StorageService) {}

  @Get('status')
  getStatus() {
    return {
      cloudflareActive: this.storageService.isCloudflareActive(),
      storageProvider: this.storageService.isCloudflareActive() ? 'Cloudflare R2' : 'Local Disk',
    };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
    }),
  )
  async uploadSingle(
    @UploadedFile() file: any,
    @Body() body: { base64?: string; folder?: string; filename?: string },
    @Query('folder') queryFolder?: string,
  ) {
    const folder = body.folder || queryFolder || 'general';

    // 1. If uploaded as multipart form file
    if (file) {
      const res = await this.storageService.uploadFile(
        {
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
        },
        folder,
      );
      return {
        message: 'تم رفع الملف بنجاح',
        ...res,
      };
    }

    // 2. If sent as base64 string
    if (body.base64) {
      const res = await this.storageService.uploadBase64(
        body.base64,
        folder,
        body.filename || 'upload.jpg',
      );
      return {
        message: 'تم رفع الملف بنجاح',
        ...res,
      };
    }

    throw new BadRequestException('يرجى تحديد ملف لرفعه (form-data: file) أو تزويد الصورة بتنسيق Base64');
  }
}
