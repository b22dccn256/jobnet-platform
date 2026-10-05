import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PremiumPackageService } from './premium-packages.service';

// TODO (Tuấn): gắn RolesGuard + @Roles(...) và DTO validate cho từng endpoint
@ApiTags('premium-packages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('premium-packages')
export class PremiumPackageController {
  constructor(private readonly service: PremiumPackageService) {}

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
