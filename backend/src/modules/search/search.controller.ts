import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SearchJobsDto, SuggestJobsDto } from './dto/search.dto';
import { SearchService } from './search.service';

// Phụ trách: Hà
@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get('jobs')
  @ApiOperation({ summary: 'Tìm kiếm và lọc việc làm (Elasticsearch + fallback MongoDB)' })
  searchJobs(@Query() query: SearchJobsDto) {
    return this.service.searchJobs(query.q || '', query);
  }

  @Get('suggest')
  @ApiOperation({ summary: 'Gợi ý từ khóa / kỹ năng khi tìm việc' })
  suggest(@Query() query: SuggestJobsDto) {
    return this.service.suggest(query.q || '');
  }

  @Post('reindex')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đồng bộ lại toàn bộ việc làm đã duyệt vào Elasticsearch (Admin)' })
  reindex() {
    return this.service.reindexAllApproved();
  }
}
