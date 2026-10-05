import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RecommendationService } from './recommendation.service';

// Phụ trách: Tuấn
@ApiTags('recommendation')
@Controller('recommendation')
export class RecommendationController {
  constructor(private readonly service: RecommendationService) {}


  @Get('jobs/:jobId/candidates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  candidates(@Param('jobId') jobId: string, @Query('page') page = 1, @Query('limit') limit = 10) {
    // TODO (Tuấn): RolesGuard(employer) + kiểm tra gói premium
    return this.service.recommendCandidates(jobId, Number(page), Number(limit));
  }

}
