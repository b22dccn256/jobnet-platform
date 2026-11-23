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
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { CreatePremiumPackageDto, UpdatePremiumPackageDto } from './dto/premium-package.dto';
import { PremiumPackageService } from './premium-packages.service';

// Phụ trách: Tuấn
@ApiTags('premium-packages')
@Controller('premium-packages')
export class PremiumPackageController {
  constructor(private readonly service: PremiumPackageService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo gói dịch vụ mới (Admin)' })
  create(@Body() dto: CreatePremiumPackageDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách các gói dịch vụ đăng tin (Công khai)' })
  findAll(@Query() q: PaginationDto) {
    return this.service.findAll(q.page, q.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết gói dịch vụ (Công khai)' })
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật gói dịch vụ (Admin)' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdatePremiumPackageDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa gói dịch vụ (Admin)' })
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.remove(id);
  }
}
