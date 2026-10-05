import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService {

  private client: Minio.Client;
  private bucket: string;

  constructor(cfg: ConfigService) {
    this.bucket = cfg.get('MINIO_BUCKET') || 'jobnet';
    this.client = new Minio.Client({
      endPoint: cfg.get('MINIO_ENDPOINT') || 'localhost',
      port: Number(cfg.get('MINIO_PORT') || 9000),
      useSSL: cfg.get('MINIO_USE_SSL') === 'true',
      accessKey: cfg.get('MINIO_ACCESS_KEY'),
      secretKey: cfg.get('MINIO_SECRET_KEY'),
    });
  }

  async onModuleInit() {
    const exists = await this.client.bucketExists(this.bucket).catch(() => false);
    if (!exists) await this.client.makeBucket(this.bucket).catch(() => undefined);
  }

  async upload(file: Express.Multer.File, folder: 'cv' | 'avatar' | 'company') {
    const name = `${folder}/${Date.now()}-${file.originalname}`;
    await this.client.putObject(this.bucket, name, file.buffer, file.size, { 'Content-Type': file.mimetype });
    return { key: name };
  }

  /** TODO (Hà): presigned URL để tải/xem CV */
  async getUrl(key: string) {
    return this.client.presignedGetObject(this.bucket, key, 60 * 60);
  }

}
