import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ApplicationStatus } from '../../../common/enums/application-status.enum';

export class CreateApplicationDto {
  @ApiProperty({ description: 'ID tin tuyển dụng cần ứng tuyển' })
  @IsMongoId()
  jobId: string;

  @ApiPropertyOptional({ example: 'cv/1710000000-cv.pdf' })
  @IsOptional()
  @IsString()
  cvUrl?: string;

  @ApiPropertyOptional({ example: 'Tôi rất quan tâm đến vị trí này...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverLetter?: string;
}

export class UpdateApplicationStatusDto {
  @ApiProperty({ enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Gửi email thông báo trạng thái cho ứng viên', default: false })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  notifyByEmail?: boolean;

  @ApiPropertyOptional({ example: 'Mời bạn tham gia phỏng vấn lúc 9h sáng thứ Hai.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class QueryApplicationDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Lọc theo ID tin tuyển dụng' })
  @IsOptional()
  @IsMongoId()
  jobId?: string;
}
