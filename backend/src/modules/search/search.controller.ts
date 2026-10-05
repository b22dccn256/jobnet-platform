import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SearchService } from './search.service';

// Phụ trách: Hà
@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}


  @Get('jobs')
  searchJobs(@Query('q') q = '', @Query() filters: Record<string, any>) {
    return this.service.searchJobs(q, filters);
  }

  @Get('suggest')
  suggest(@Query('q') q = '') {
    return this.service.suggest(q);
  }

}
