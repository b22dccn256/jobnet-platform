import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { JOB_LEVELS } from '../../../jobs/dto/job.dto';

export const CV_TEMPLATES = ['modern', 'classic', 'minimal'] as const;
export type CvTemplateType = (typeof CV_TEMPLATES)[number];

export class UpdateCvSettingsDto {
  @ApiPropertyOptional({ enum: CV_TEMPLATES, default: 'modern' })
  @IsOptional()
  @IsIn(CV_TEMPLATES)
  cvTemplate?: CvTemplateType;

  @ApiPropertyOptional({ example: true, description: 'Cho phép chia sẻ CV qua đường dẫn công khai' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  isCvPublic?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Tạo lại mã chia sẻ CV mới' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  regenerateShareToken?: boolean;

  @ApiPropertyOptional({ example: 'Lập trình viên Backend với 2 năm kinh nghiệm NestJS & MongoDB.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ type: [String], example: ['TypeScript', 'NestJS', 'MongoDB'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: 'Backend NestJS Developer' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  desiredTitle?: string;

  @ApiPropertyOptional({ enum: JOB_LEVELS })
  @IsOptional()
  @IsIn(JOB_LEVELS)
  desiredLevel?: (typeof JOB_LEVELS)[number];

  @ApiPropertyOptional({ example: 15000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  desiredSalaryMin?: number;

  @ApiPropertyOptional({ example: 'Hà Nội' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  desiredLocation?: string;
}

export class ExportCvPdfQueryDto {
  @ApiPropertyOptional({ enum: CV_TEMPLATES, description: 'Mẫu CV muốn xuất PDF' })
  @IsOptional()
  @IsIn(CV_TEMPLATES)
  template?: CvTemplateType;
}
