import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export const INSIGHT_TYPES = ['salary_by_category', 'hot_skills', 'demand_trend'] as const;
export type InsightType = (typeof INSIGHT_TYPES)[number];

export class QueryMarketInsightDto extends PaginationDto {
  @ApiPropertyOptional({ enum: INSIGHT_TYPES, description: 'Loại thống kê thị trường' })
  @IsOptional()
  @IsIn(INSIGHT_TYPES)
  type?: InsightType;

  @ApiPropertyOptional({ example: '2026-11', description: 'Kỳ thống kê YYYY-MM' })
  @IsOptional()
  @IsString()
  period?: string;
}

export class CreateMarketInsightDto {
  @ApiProperty({ enum: INSIGHT_TYPES })
  @IsIn(INSIGHT_TYPES)
  type: InsightType;

  @ApiProperty({ example: '2026-11' })
  @IsString()
  @IsNotEmpty()
  period: string;

  @ApiProperty({ description: 'Dữ liệu thống kê tổng hợp' })
  @IsNotEmpty()
  data: unknown;
}

export class UpdateMarketInsightDto {
  @ApiPropertyOptional({ enum: INSIGHT_TYPES })
  @IsOptional()
  @IsIn(INSIGHT_TYPES)
  type?: InsightType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional()
  @IsOptional()
  data?: unknown;
}
