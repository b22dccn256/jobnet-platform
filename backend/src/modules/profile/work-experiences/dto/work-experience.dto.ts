import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWorkExperienceDto {
  @ApiProperty({ example: 'Backend Developer Intern' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  position: string;

  @ApiProperty({ example: 'Công ty Cổ phần Công nghệ ABC' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  company: string;

  @ApiPropertyOptional({ example: '2025-01-15' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-07-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Phát triển REST API bằng NestJS và tối ưu truy vấn MongoDB.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateWorkExperienceDto {
  @ApiPropertyOptional({ example: 'Backend Developer' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  position?: string;

  @ApiPropertyOptional({ example: 'Công ty Cổ phần Công nghệ ABC' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  company?: string;

  @ApiPropertyOptional({ example: '2025-01-15' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-07-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
