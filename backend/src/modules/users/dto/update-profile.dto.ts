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
