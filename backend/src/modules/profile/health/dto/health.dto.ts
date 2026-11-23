import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpsertHealthDto {
  @ApiPropertyOptional({ example: 172, description: 'Chiều cao (cm)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(50)
  @Max(250)
  height?: number;

  @ApiPropertyOptional({ example: 65, description: 'Cân nặng (kg)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(20)
  @Max(300)
  weight?: number;

  @ApiPropertyOptional({ example: 'Sức khỏe tốt, có thể đi công tác' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
