import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateScrapedJobDto {
  @ApiPropertyOptional({ example: 'topcv' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ example: 'https://example.com/jobs/123' })
  @IsString()
  @IsNotEmpty()
  sourceUrl: string;

  @ApiPropertyOptional({ example: 'Backend Node.js Developer' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Công ty XYZ' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ example: 'Hà Nội' })
  @IsOptional()
  @IsString()
  location?: string;

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

  @ApiPropertyOptional({ type: [String], example: ['NodeJS', 'TypeScript'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: 'Công nghệ thông tin' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  postedAt?: string;
}

export class UpdateScrapedJobDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

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

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}

export class QueryScrapedJobDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Tìm theo tiêu đề, công ty hoặc kỹ năng' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Nguồn thu thập' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Ngành nghề' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Địa điểm' })
  @IsOptional()
  @IsString()
  location?: string;
}
