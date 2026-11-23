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
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Role } from '../../../common/enums/role.enum';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AuthUserPayload } from '../../../common/interfaces/auth-user.interface';
import { ParseObjectIdPipe } from '../../../common/pipes/parse-object-id.pipe';
import { UpsertHealthDto } from './dto/health.dto';
import { HealthService } from './health.service';

// Phụ trách: Hà
@ApiTags('health')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Candidate)
@Controller('health')
export class HealthController {
  constructor(private readonly service: HealthService) {}

  @Post()
  @ApiOperation({ summary: 'Thêm thông tin sức khỏe của ứng viên' })
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: UpsertHealthDto) {
    return this.service.createForUser(user.userId, { ...dto });
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách thông tin sức khỏe của ứng viên hiện tại' })
  findAll(@CurrentUser() user: AuthUserPayload, @Query() q: PaginationDto) {
    return this.service.findAllByUser(user.userId, q.page, q.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết thông tin sức khỏe' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.service.findOneForUser(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin sức khỏe' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpsertHealthDto,
  ) {
    return this.service.updateForUser(id, user.userId, { ...dto });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thông tin sức khỏe' })
  remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.service.removeForUser(id, user.userId);
  }
}
