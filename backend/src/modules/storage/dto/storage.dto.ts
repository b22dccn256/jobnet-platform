import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const STORAGE_FOLDERS = ['cv', 'avatar', 'company'] as const;
export type StorageFolder = (typeof STORAGE_FOLDERS)[number];

export class UploadQueryDto {
  @ApiPropertyOptional({ enum: STORAGE_FOLDERS, default: 'cv' })
  @IsOptional()
  @IsIn(STORAGE_FOLDERS)
  folder?: StorageFolder = 'cv';
}

export class StorageKeyQueryDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}
