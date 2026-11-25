import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOtherInfoDto {
  @ApiProperty({ example: 'Giải khuyến khích Olympic Tin học, thích đọc sách kỹ thuật.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({ example: 'Không' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  religion?: string;

  @ApiPropertyOptional({ example: 'Hải Phòng' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  hometown?: string;

  @ApiPropertyOptional({ example: '0968397313' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  emergencyContact?: string;
}

export class UpdateOtherInfoDto {
  @ApiPropertyOptional({ example: 'Nội dung bổ sung hồ sơ' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @ApiPropertyOptional({ example: 'Không' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  religion?: string;

  @ApiPropertyOptional({ example: 'Hải Phòng' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  hometown?: string;

  @ApiPropertyOptional({ example: '0968397313' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  emergencyContact?: string;
}
