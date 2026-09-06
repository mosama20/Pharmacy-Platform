import { BadRequestException } from '@nestjs/common';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

const SSRF_BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254',
  'metadata.google.internal',
]);

export function isPrivateIp(hostname: string): boolean {
  if (SSRF_BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) return true;
  // Check private subnets: 10.x.x.x, 192.168.x.x, 172.16.x.x - 172.31.x.x
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  return false;
}

export function validateMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  // PDF: %PDF- (25 50 44 46 2D)
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return 'application/pdf';
  }

  // WebP: RIFF ... WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString('utf8', 0, 4) === 'RIFF' &&
    buffer.toString('utf8', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

export function validateUploadedImage(
  dataUriOrUrl: string,
  maxBytes: number = MAX_UPLOAD_BYTES,
): { valid: boolean; detectedMime?: string } {
  if (!dataUriOrUrl || typeof dataUriOrUrl !== 'string') {
    throw new BadRequestException('ملف غير صالح أو فارغ');
  }

  const trimmed = dataUriOrUrl.trim();

  // If it's a data URI
  if (trimmed.startsWith('data:')) {
    const matches = trimmed.match(/^data:([a-zA-Z0-9_+.-]+\/[a-zA-Z0-9_+.-]+);base64,(.+)$/);
    if (!matches) {
      throw new BadRequestException('صيغة ملف base64 غير صالحة. يجب أن تتضمن نوع MIME والتشفير الصحيح.');
    }

    const declaredMime = matches[1].toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(declaredMime)) {
      throw new BadRequestException(`نوع الملف ${declaredMime} غير مدعوم. يسمح فقط بالصور (JPG, PNG, WEBP) وملفات PDF.`);
    }

    const base64Data = matches[2];
    const estimatedSize = Math.floor((base64Data.length * 3) / 4);
    if (estimatedSize > maxBytes) {
      throw new BadRequestException(`حجم الملف يتجاوز الحد المسموح به (${(maxBytes / (1024 * 1024)).toFixed(0)} ميجابايت).`);
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > maxBytes) {
      throw new BadRequestException(`حجم الملف يتجاوز الحد المسموح به (${(maxBytes / (1024 * 1024)).toFixed(0)} ميجابايت).`);
    }

    const detectedMime = validateMagicBytes(buffer);
    if (!detectedMime) {
      throw new BadRequestException('محتوى الملف تالف أو لا يطابق التوقيع الرقمي للنوع المعلن.');
    }

    if (declaredMime === 'image/jpg' && detectedMime === 'image/jpeg') {
      // Allowed alias
    } else if (declaredMime !== detectedMime) {
      throw new BadRequestException(`توقيع الملف الرقمي (${detectedMime}) لا يطابق النوع المصرح به (${declaredMime}).`);
    }

    return { valid: true, detectedMime };
  }

  // If it's an HTTP/HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new BadRequestException('رابط الصورة غير صالح');
    }

    if (isPrivateIp(parsed.hostname)) {
      throw new BadRequestException('الرابط يشير إلى عنوان محظور أو خادم داخلي (SSRF Prevention)');
    }

    return { valid: true };
  }

  throw new BadRequestException('صيغة المرفق غير مقبولة: يجب أن تكون رابطاً صحيحاً (https://) أو بيانات مشفرة (data:image/...)');
}
