import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Công nghệ thông tin' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'cong-nghe-thong-tin' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional({ example: 'Việc làm lập trình, kiểm thử, dữ liệu, hệ thống' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Công nghệ thông tin' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'cong-nghe-thong-tin' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional({ example: 'Mô tả danh mục' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class QueryCategoryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm danh mục' })
  @IsOptional()
  @IsString()
  q?: string;
}
