import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JOB_LEVELS, WORK_MODES } from '../../jobs/dto/job.dto';

export class SearchJobsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm việc làm' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Kỹ năng phân cách bởi dấu phẩy' })
  @IsOptional()
  @IsString()
  skills?: string;

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

  @ApiPropertyOptional({ description: 'ID danh mục' })
  @IsOptional()
  @IsMongoId()
  category?: string;

  @ApiPropertyOptional({ description: 'Mức lương tối thiểu' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ description: 'Mức lương tối đa' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryMax?: number;
}

export class SuggestJobsDto {
  @ApiPropertyOptional({ description: 'Tiền tố gợi ý từ khóa' })
  @IsOptional()
  @IsString()
  q?: string;
}
