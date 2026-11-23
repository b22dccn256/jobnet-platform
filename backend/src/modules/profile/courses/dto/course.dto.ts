import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'NestJS Microservices & Architecture' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Coursera / Udemy' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  organization?: string;

  @ApiPropertyOptional({ example: '2025-05-15' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'NestJS Microservices & Architecture' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'Coursera / Udemy' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  organization?: string;

  @ApiPropertyOptional({ example: '2025-05-15' })
  @IsOptional()
  @IsDateString()
  date?: string;
}
