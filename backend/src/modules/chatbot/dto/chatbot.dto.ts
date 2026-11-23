import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ChatHistoryItemDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty({ example: 'Tôi muốn tìm việc Backend NestJS ở Hà Nội' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

export class ChatRequestDto {
  @ApiProperty({ example: 'Tìm việc làm NestJS lương trên 15 triệu tại Hà Nội' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;

  @ApiPropertyOptional({ type: [ChatHistoryItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];
}
