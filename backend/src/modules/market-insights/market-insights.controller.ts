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
  CreateMarketInsightDto,
  QueryMarketInsightDto,
  UpdateMarketInsightDto,
} from './dto/market-insight.dto';
import { MarketInsightService } from './market-insights.service';

// Phụ trách: Hà
@ApiTags('market-insights')
@Controller('market-insights')
export class MarketInsightController {
  constructor(private readonly service: MarketInsightService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách thống kê thị trường việc làm (Công khai)' })
  findAll(@Query() q: QueryMarketInsightDto) {
    return this.service.findAll(q);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Tổng quan 3 biểu đồ thị trường: lương, kỹ năng hot, xu hướng (Công khai)' })
  overview() {
    return this.service.getOverview();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết một bản ghi thống kê thị trường (Công khai)' })
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post('recalculate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tổng hợp lại chỉ số thị trường từ dữ liệu việc làm (Admin)' })
  recalculate() {
    return this.service.recalculate();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo bản ghi thống kê thị trường (Admin)' })
  create(@Body() dto: CreateMarketInsightDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thống kê thị trường (Admin)' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateMarketInsightDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa bản ghi thống kê thị trường (Admin)' })
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.remove(id);
  }
}
