import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { MarketInsightService } from './market-insights.service';

// TODO (Hà): gắn RolesGuard + @Roles(...) và DTO validate cho từng endpoint
@ApiTags('market-insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('market-insights')
export class MarketInsightController {
  constructor(private readonly service: MarketInsightService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get()
  findAll(@Query() q: PaginationDto) {
    return this.service.findAll(q.page, q.limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
