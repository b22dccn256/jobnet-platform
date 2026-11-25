import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { JOB_LEVELS } from '../../jobs/dto/job.dto';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'avatar/12345.png' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'avatar/cover-12345.jpg' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ example: 'Nam' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  gender?: string;

  @ApiPropertyOptional({ example: '1999-02-07' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Việt Nam' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nationality?: string;

  @ApiPropertyOptional({ example: 'Quận Cầu Giấy, Hà Nội' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  address?: string;

  @ApiPropertyOptional({ example: 'https://github.com/username' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  website?: string;

  @ApiPropertyOptional({ example: 'Lập trình viên Backend NestJS với 2 năm kinh nghiệm...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ type: [String], example: ['TypeScript', 'NestJS', 'MongoDB'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: 'Backend Developer' })
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

  @ApiPropertyOptional({ example: 'cv/12345-cv.pdf' })
  @IsOptional()
  @IsString()
  cvUrl?: string;
}
