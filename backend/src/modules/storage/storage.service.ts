import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as Minio from 'minio';
import * as path from 'path';
import { StorageFolder } from './dto/storage.dto';

const MAX_CV_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const ALLOWED_EXTENSIONS: Record<StorageFolder, string[]> = {
  cv: ['.pdf', '.doc', '.docx'],
  avatar: ['.png', '.jpg', '.jpeg', '.webp'],
  company: ['.png', '.jpg', '.jpeg', '.webp'],
};

const ALLOWED_MIMES: Record<StorageFolder, string[]> = {
  cv: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  avatar: ['image/png', 'image/jpeg', 'image/webp'],
  company: ['image/png', 'image/jpeg', 'image/webp'],
};

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: Minio.Client;
  private bucket: string;
  private minioReady = false;
  private readonly localUploadDir = path.resolve(process.cwd(), 'uploads');

  constructor(private readonly cfg: ConfigService) {
    this.bucket = cfg.get<string>('MINIO_BUCKET') || 'jobnet';
    this.client = new Minio.Client({
      endPoint: cfg.get<string>('MINIO_ENDPOINT') || 'localhost',
      port: Number(cfg.get<string>('MINIO_PORT') || 9000),
      useSSL: cfg.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: cfg.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: cfg.get<string>('MINIO_SECRET_KEY') || 'change_me_too',
    });
  }

  async onModuleInit() {
    try {
      const exists = await Promise.race<boolean>([
        this.client.bucketExists(this.bucket),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('MinIO connection timeout')), 1500),
        ),
      ]);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
      }
      this.minioReady = true;
      this.logger.log(`MinIO connected (bucket: ${this.bucket})`);
    } catch (error) {
      this.minioReady = false;
      const errObj = error as { message?: string; code?: string } | undefined;
      const reason = errObj?.message || errObj?.code || String(error || 'connection failed');
      this.logger.warn(
        `MinIO unavailable (${reason}). Using local disk fallback at ${this.localUploadDir}`,
      );
    }
  }

  validateFile(file: Express.Multer.File | undefined, folder: StorageFolder) {
    if (!file) {
      throw new BadRequestException('Vui lòng đính kèm file tải lên');
    }

    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExts = ALLOWED_EXTENSIONS[folder];
    const allowedMimes = ALLOWED_MIMES[folder];
    if (!allowedExts.includes(ext) || !allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Định dạng file không hợp lệ cho thư mục ${folder}. Cho phép: ${allowedExts.join(', ')}`,
      );
    }

    const maxBytes = folder === 'cv' ? MAX_CV_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      const maxMb = Math.round(maxBytes / (1024 * 1024));
      throw new BadRequestException(`Dung lượng file vượt quá giới hạn ${maxMb}MB`);
    }
  }

  private sanitizeKey(rawKey: string): string {
    const normalized = rawKey.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!normalized || normalized.includes('..')) {
      throw new BadRequestException('Key lưu trữ không hợp lệ');
    }
    return normalized;
  }

  private buildObjectKey(file: Express.Multer.File, folder: StorageFolder): string {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const rawBase = path.basename(file.originalname || 'file', ext);
    const safeBase =
      rawBase
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40) || 'file';
    const uid = crypto.randomBytes(4).toString('hex');
    return `${folder}/${Date.now()}-${uid}-${safeBase}${ext}`;
  }

  async upload(file: Express.Multer.File | undefined, folder: StorageFolder = 'cv') {
    this.validateFile(file, folder);
    const checkedFile = file!;
    const key = this.buildObjectKey(checkedFile, folder);

    if (this.minioReady) {
      try {
        await this.client.putObject(this.bucket, key, checkedFile.buffer, checkedFile.size, {
          'Content-Type': checkedFile.mimetype,
        });
        const url = await this.getUrl(key);
        return {
          key,
          url,
          size: checkedFile.size,
          mimetype: checkedFile.mimetype,
          storage: 'minio',
        };
      } catch (error) {
        this.logger.warn(`MinIO upload failed, falling back to local disk: ${(error as Error).message}`);
      }
    }

    const targetPath = path.join(this.localUploadDir, key);
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.writeFile(targetPath, checkedFile.buffer);

    return {
      key,
      url: await this.getLocalFileUrl(key),
      size: checkedFile.size,
      mimetype: checkedFile.mimetype,
      storage: 'local',
    };
  }

  private async getLocalFileUrl(key: string): Promise<string> {
    const port = this.cfg.get<string>('PORT') || '4000';
    return `http://localhost:${port}/api/storage/file?key=${encodeURIComponent(key)}`;
  }

  async getUrl(rawKey: string) {
    const key = this.sanitizeKey(rawKey);
    if (this.minioReady) {
      try {
        const url = await this.client.presignedGetObject(this.bucket, key, 60 * 60);
        return { key, url, storage: 'minio' };
      } catch (error) {
        this.logger.warn(`MinIO presigned URL failed: ${(error as Error).message}`);
      }
    }

    const localPath = path.resolve(this.localUploadDir, key);
    if (!localPath.startsWith(this.localUploadDir) || !fs.existsSync(localPath)) {
      throw new NotFoundException('Không tìm thấy tệp tin lưu trữ');
    }
    return { key, url: await this.getLocalFileUrl(key), storage: 'local' };
  }

  async getFileBuffer(rawKey: string): Promise<{ buffer: Buffer; filename: string }> {
    const key = this.sanitizeKey(rawKey);
    if (this.minioReady) {
      try {
        const stream = await this.client.getObject(this.bucket, key);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return { buffer: Buffer.concat(chunks), filename: path.basename(key) };
      } catch {
        // Check local fallback if object was written locally
      }
    }

    const localPath = path.resolve(this.localUploadDir, key);
    if (!localPath.startsWith(this.localUploadDir) || !fs.existsSync(localPath)) {
      throw new NotFoundException('Không tìm thấy tệp tin');
    }
    const buffer = await fs.promises.readFile(localPath);
    return { buffer, filename: path.basename(key) };
  }
}
