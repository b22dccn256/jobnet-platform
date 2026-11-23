import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLanguageDto {
  @ApiProperty({ example: 'Tiếng Anh' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ example: 'IELTS 6.5 / Thành thạo đọc hiểu tài liệu' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  level?: string;
}

export class UpdateLanguageDto {
  @ApiPropertyOptional({ example: 'Tiếng Anh' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: 'TOEIC 750' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  level?: string;
}
