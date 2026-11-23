import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JobStatus } from '../../../common/enums/job-status.enum';

export const WORK_MODES = ['onsite', 'remote', 'hybrid'] as const;
export const JOB_LEVELS = ['intern', 'junior', 'middle', 'senior'] as const;

export class CreateJobDto {
  @ApiProperty({ example: 'Backend NestJS Developer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'ID danh mục việc làm' })
  @IsOptional()
  @IsMongoId()
  category?: string;

  @ApiPropertyOptional({ example: 'Phát triển hệ thống API NestJS + MongoDB...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Thưởng tháng 13, bảo hiểm đầy đủ...' })
  @IsOptional()
  @IsString()
  benefits?: string;

  @ApiPropertyOptional({ example: 'Có kinh nghiệm TypeScript, Node.js từ 1 năm...' })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ type: [String], example: ['TypeScript', 'NestJS', 'MongoDB'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: 'Hà Nội' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @ApiPropertyOptional({ enum: WORK_MODES, default: 'onsite' })
  @IsOptional()
  @IsIn(WORK_MODES)
  workMode?: (typeof WORK_MODES)[number];

  @ApiPropertyOptional({ enum: JOB_LEVELS, default: 'junior' })
  @IsOptional()
  @IsIn(JOB_LEVELS)
  level?: (typeof JOB_LEVELS)[number];

  @ApiPropertyOptional({ example: 'Đại học' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  education?: string;

  @ApiPropertyOptional({ example: 15000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ example: 25000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}

export class UpdateJobDto {
  @ApiPropertyOptional({ example: 'Backend NestJS Developer' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  benefits?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @ApiPropertyOptional({ enum: WORK_MODES })
  @IsOptional()
  @IsIn(WORK_MODES)
  workMode?: (typeof WORK_MODES)[number];

  @ApiPropertyOptional({ enum: JOB_LEVELS })
  @IsOptional()
  @IsIn(JOB_LEVELS)
  level?: (typeof JOB_LEVELS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  education?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deadline?: string;
}

export class QueryJobDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm theo tiêu đề, kỹ năng hoặc địa điểm' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'ID danh mục' })
  @IsOptional()
  @IsMongoId()
  category?: string;

  @ApiPropertyOptional({ description: 'ID công ty' })
  @IsOptional()
  @IsMongoId()
  company?: string;

  @ApiPropertyOptional({ description: 'Địa điểm làm việc' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: WORK_MODES })
  @IsOptional()
  @IsIn(WORK_MODES)
  workMode?: (typeof WORK_MODES)[number];

  @ApiPropertyOptional({ enum: JOB_LEVELS })
  @IsOptional()
  @IsIn(JOB_LEVELS)
  level?: (typeof JOB_LEVELS)[number];

  @ApiPropertyOptional({ description: 'Kỹ năng (phân cách bởi dấu phẩy, vd: NestJS,React)' })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional({ description: 'Mức lương tối thiểu mong muốn' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ description: 'Mức lương tối đa mong muốn' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryMax?: number;
}

export class EmployerQueryJobDto extends PaginationDto {
  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}
