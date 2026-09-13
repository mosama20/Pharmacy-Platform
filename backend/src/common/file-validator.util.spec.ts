import { BadRequestException } from '@nestjs/common';
import {
  isPrivateIp,
  validateMagicBytes,
  validateUploadedImage,
} from './file-validator.util';

describe('File Validator Utility (Security & Magic Bytes)', () => {
  describe('isPrivateIp() (SSRF Prevention)', () => {
    it('should detect localhost and loopback addresses as private', () => {
      expect(isPrivateIp('localhost')).toBe(true);
      expect(isPrivateIp('127.0.0.1')).toBe(true);
      expect(isPrivateIp('0.0.0.0')).toBe(true);
      expect(isPrivateIp('::1')).toBe(true);
    });

    it('should detect cloud metadata endpoints as private', () => {
      expect(isPrivateIp('169.254.169.254')).toBe(true);
      expect(isPrivateIp('metadata.google.internal')).toBe(true);
    });

    it('should detect private LAN subnets (10.x, 192.168.x, 172.16-31.x)', () => {
      expect(isPrivateIp('10.0.0.1')).toBe(true);
      expect(isPrivateIp('192.168.1.1')).toBe(true);
      expect(isPrivateIp('172.20.0.5')).toBe(true);
    });

    it('should allow public hostnames', () => {
      expect(isPrivateIp('images.unsplash.com')).toBe(false);
      expect(isPrivateIp('chefaa.com')).toBe(false);
      expect(isPrivateIp('8.8.8.8')).toBe(false);
    });
  });

  describe('validateMagicBytes()', () => {
    it('should detect valid JPEG magic bytes (FF D8 FF)', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(validateMagicBytes(jpegBuffer)).toBe('image/jpeg');
    });

    it('should detect valid PNG magic bytes (89 50 4E 47)', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      expect(validateMagicBytes(pngBuffer)).toBe('image/png');
    });

    it('should detect valid PDF magic bytes (%PDF-)', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 test header');
      expect(validateMagicBytes(pdfBuffer)).toBe('application/pdf');
    });

    it('should detect valid WebP magic bytes (RIFF...WEBP)', () => {
      const webpBuffer = Buffer.concat([
        Buffer.from('RIFF'),
        Buffer.from([0x00, 0x00, 0x00, 0x00]),
        Buffer.from('WEBP'),
      ]);
      expect(validateMagicBytes(webpBuffer)).toBe('image/webp');
    });

    it('should return null for unrecognized or corrupted bytes', () => {
      const fakeBuffer = Buffer.from('MZ executable header or random bytes');
      expect(validateMagicBytes(fakeBuffer)).toBeNull();
    });
  });

  describe('validateUploadedImage()', () => {
    it('should validate a valid base64 PNG image', () => {
      const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const dataUri = `data:image/png;base64,${pngBytes.toString('base64')}`;

      const result = validateUploadedImage(dataUri);
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe('image/png');
    });

    it('should reject disguised malicious file where declared MIME does not match magic bytes', () => {
      const maliciousBytes = Buffer.from('MZ Windows PE Executable disguised as PNG');
      const spoofedDataUri = `data:image/png;base64,${maliciousBytes.toString('base64')}`;

      expect(() => validateUploadedImage(spoofedDataUri)).toThrow(BadRequestException);
    });

    it('should reject file exceeding maximum size limit', () => {
      const pngBytes = Buffer.alloc(100);
      const dataUri = `data:image/png;base64,${pngBytes.toString('base64')}`;

      // Max allowed 50 bytes
      expect(() => validateUploadedImage(dataUri, 50)).toThrow(BadRequestException);
    });

    it('should reject SSRF attempt targeting cloud metadata via image URL', () => {
      const ssrfUrl = 'http://169.254.169.254/latest/meta-data/';
      expect(() => validateUploadedImage(ssrfUrl)).toThrow(BadRequestException);
    });

    it('should allow valid public HTTPS image URLs', () => {
      const validUrl = 'https://images.unsplash.com/photo-1234.jpg';
      const res = validateUploadedImage(validUrl);
      expect(res.valid).toBe(true);
    });
  });
});
