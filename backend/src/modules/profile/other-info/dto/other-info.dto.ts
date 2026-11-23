import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOtherInfoDto {
  @ApiProperty({ example: 'Giải khuyến khích Olympic Tin học, thích đọc sách kỹ thuật.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

export class UpdateOtherInfoDto {
  @ApiPropertyOptional({ example: 'Nội dung bổ sung hồ sơ' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content?: string;
}
