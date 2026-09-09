import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private readonly r2Bucket: string;
  private readonly r2PublicUrl: string;
  private readonly localUploadDir: string;

  constructor() {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
    this.r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim() || '';
    this.r2PublicUrl = (process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim() || '').replace(/\/+$/, '');

    // Setup local upload directory fallback
    this.localUploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.localUploadDir)) {
      try {
        fs.mkdirSync(this.localUploadDir, { recursive: true });
      } catch (err) {
        this.logger.error(`Could not create local upload directory: ${err.message}`);
      }
    }

    if (accountId && accessKeyId && secretAccessKey && this.r2Bucket) {
      try {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.logger.log(`☁️ Cloudflare R2 storage initialized successfully for bucket "${this.r2Bucket}"`);
      } catch (err) {
        this.logger.error(`❌ Failed to initialize Cloudflare R2 client: ${err.message}`);
        this.s3Client = null;
      }
    } else {
      this.logger.warn('ℹ️ Cloudflare R2 credentials not fully set. Using local disk fallback storage (/uploads).');
    }
  }

  isCloudflareActive(): boolean {
    return !!this.s3Client && !!this.r2Bucket;
  }

  async uploadFile(
    file: { buffer: Buffer; originalname: string; mimetype: string },
    folder: string = 'general',
  ): Promise<{ url: string; key: string; provider: 'cloudflare' | 'local'; size: number }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('الملف المرفوع غير صالح أو فارغ');
    }

    const ext = path.extname(file.originalname) || this.getExtensionFromMime(file.mimetype) || '.jpg';
    const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
    const filename = `${Date.now()}_${uuidv4().substring(0, 8)}${ext}`;
    const key = `${cleanFolder}/${filename}`;

    // 1. Try Cloudflare R2 if configured
    if (this.s3Client && this.r2Bucket) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.r2Bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype || 'image/jpeg',
          CacheControl: 'public, max-age=31536000, immutable',
        });

        await this.s3Client.send(command);

        const url = this.r2PublicUrl
          ? `${this.r2PublicUrl}/${key}`
          : `https://${this.r2Bucket}.r2.dev/${key}`;

        this.logger.log(`Uploaded to Cloudflare R2: ${url}`);
        return { url, key, provider: 'cloudflare', size: file.buffer.length };
      } catch (error) {
        this.logger.error(`Cloudflare R2 upload failed, falling back to local: ${error.message}`);
      }
    }

    // 2. Fallback to Local storage
    const targetFolder = path.join(this.localUploadDir, cleanFolder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const localFilePath = path.join(targetFolder, filename);
    fs.writeFileSync(localFilePath, file.buffer);

    const relativeUrl = `/uploads/${cleanFolder}/${filename}`;
    return {
      url: relativeUrl,
      key,
      provider: 'local',
      size: file.buffer.length,
    };
  }

  async uploadBase64(
    base64Data: string,
    folder: string = 'prescriptions',
    fallbackFilename: string = 'upload.jpg',
  ): Promise<{ url: string; key: string; provider: 'cloudflare' | 'local' }> {
    if (!base64Data || typeof base64Data !== 'string') {
      throw new BadRequestException('بيانات الصورة بتنسيق Base64 غير صالحة');
    }

    // Extract mime type if data URL
    let mimeType = 'image/jpeg';
    let base64Clean = base64Data;
    const match = base64Data.match(/^data:([^;]+);base64,(.*)$/);
    if (match) {
      mimeType = match[1];
      base64Clean = match[2];
    }

    const buffer = Buffer.from(base64Clean, 'base64');
    const ext = this.getExtensionFromMime(mimeType) || '.jpg';
    const originalname = fallbackFilename.endsWith(ext) ? fallbackFilename : `${fallbackFilename}${ext}`;

    return this.uploadFile({ buffer, originalname, mimetype: mimeType }, folder);
  }

  private getExtensionFromMime(mime: string): string {
    switch (mime.toLowerCase()) {
      case 'image/png':
        return '.png';
      case 'image/jpeg':
      case 'image/jpg':
        return '.jpg';
      case 'image/webp':
        return '.webp';
      case 'image/svg+xml':
        return '.svg';
      case 'image/gif':
        return '.gif';
      case 'application/pdf':
        return '.pdf';
      default:
        return '.jpg';
    }
  }
}
