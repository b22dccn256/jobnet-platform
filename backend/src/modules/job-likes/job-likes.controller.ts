import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUserPayload } from '../../common/interfaces/auth-user.interface';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { JobLikeService } from './job-likes.service';

// Phụ trách: Hà
@ApiTags('job-likes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Candidate)
@Controller('job-likes')
export class JobLikeController {
  constructor(private readonly service: JobLikeService) {}

  @Get('me')
  @ApiOperation({ summary: 'Danh sách việc làm đã lưu của ứng viên' })
  findMine(@CurrentUser() user: AuthUserPayload, @Query() q: PaginationDto) {
    return this.service.findMine(user.userId, q.page, q.limit);
  }

  @Get('check/:jobId')
  @ApiOperation({ summary: 'Kiểm tra ứng viên đã lưu tin tuyển dụng này chưa' })
  check(
    @CurrentUser() user: AuthUserPayload,
    @Param('jobId', ParseObjectIdPipe) jobId: string,
  ) {
    return this.service.isLiked(user.userId, jobId);
  }

  @Post(':jobId')
  @ApiOperation({ summary: 'Lưu tin tuyển dụng yêu thích (Ứng viên)' })
  like(
    @CurrentUser() user: AuthUserPayload,
    @Param('jobId', ParseObjectIdPipe) jobId: string,
  ) {
    return this.service.like(user.userId, jobId);
  }

  @Delete(':jobId')
  @ApiOperation({ summary: 'Bỏ lưu tin tuyển dụng (Ứng viên)' })
  unlike(
    @CurrentUser() user: AuthUserPayload,
    @Param('jobId', ParseObjectIdPipe) jobId: string,
  ) {
    return this.service.unlike(user.userId, jobId);
  }
}
