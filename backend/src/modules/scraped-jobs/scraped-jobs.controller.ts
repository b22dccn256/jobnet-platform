import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import {
  CreateScrapedJobDto,
  QueryScrapedJobDto,
  UpdateScrapedJobDto,
} from './dto/scraped-job.dto';
import { ScrapedJobService } from './scraped-jobs.service';

// Phụ trách: Hà
@ApiTags('scraped-jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('scraped-jobs')
export class ScrapedJobController {
  constructor(private readonly service: ScrapedJobService) {}

  @Post()
  @ApiOperation({ summary: 'Thêm bản ghi việc làm thu thập được (Admin)' })
  create(@Body() dto: CreateScrapedJobDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách dữ liệu việc làm đã cào (Admin)' })
  findAll(@Query() q: QueryScrapedJobDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết một bản ghi việc làm đã cào (Admin)' })
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật bản ghi việc làm đã cào (Admin)' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateScrapedJobDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bản ghi việc làm đã cào (Admin)' })
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.remove(id);
  }
}
