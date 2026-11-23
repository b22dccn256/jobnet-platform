import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JobStatus } from '../../../common/enums/job-status.enum';
import { Role } from '../../../common/enums/role.enum';

export class AdminUsersQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Tìm theo email hoặc họ tên' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'Lọc theo trạng thái hoạt động' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUserStatusDto {
  @ApiProperty({ example: false, description: 'true = kích hoạt, false = khóa tài khoản' })
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  isActive: boolean;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role;
}

export class AdminJobsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Tìm theo tiêu đề hoặc địa điểm' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: JobStatus, description: 'Lọc theo trạng thái kiểm duyệt' })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}

export class ModerateJobDto {
  @ApiProperty({ example: true, description: 'true = duyệt, false = từ chối' })
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  approve: boolean;

  @ApiPropertyOptional({ example: 'Nội dung tin tuyển dụng không rõ ràng' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
