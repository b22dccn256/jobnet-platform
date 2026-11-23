import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUserPayload } from '../../common/interfaces/auth-user.interface';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { RecommendationService } from './recommendation.service';

// Phụ trách: Tuấn
@ApiTags('recommendation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recommendation')
export class RecommendationController {
  constructor(private readonly service: RecommendationService) {}

  @Get('jobs')
  @Roles(Role.Candidate)
  @ApiOperation({ summary: 'Gợi ý danh sách việc làm phù hợp với hồ sơ ứng viên' })
  jobsForCandidate(@CurrentUser() user: AuthUserPayload, @Query() q: PaginationDto) {
    return this.service.recommendJobsForCandidate(user.userId, q.page, q.limit);
  }

  @Get('jobs/:jobId/candidates')
  @Roles(Role.Employer, Role.Admin)
  @ApiOperation({
    summary: 'Gợi ý & chấm điểm ứng viên phù hợp theo tin tuyển dụng (Yêu cầu gói Premium)',
  })
  candidates(
    @Param('jobId', ParseObjectIdPipe) jobId: string,
    @CurrentUser() user: AuthUserPayload,
    @Query() q: PaginationDto,
  ) {
    return this.service.recommendCandidates(jobId, user, q.page, q.limit);
  }
}
