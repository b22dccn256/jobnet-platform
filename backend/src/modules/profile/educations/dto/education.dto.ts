import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEducationDto {
  @ApiProperty({ example: 'Học viện Công nghệ Bưu chính Viễn thông' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  school: string;

  @ApiPropertyOptional({ example: 'Công nghệ thông tin' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  major?: string;

  @ApiPropertyOptional({ example: 'Kỹ sư' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  degree?: string;

  @ApiPropertyOptional({ example: '2022-09-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateEducationDto {
  @ApiPropertyOptional({ example: 'Học viện Công nghệ Bưu chính Viễn thông' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  school?: string;

  @ApiPropertyOptional({ example: 'Công nghệ thông tin' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  major?: string;

  @ApiPropertyOptional({ example: 'Kỹ sư' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  degree?: string;

  @ApiPropertyOptional({ example: '2022-09-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
