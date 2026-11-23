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
import { CreateOtherInfoDto, UpdateOtherInfoDto } from './dto/other-info.dto';
import { OtherInfoService } from './other-info.service';

// Phụ trách: Hà
@ApiTags('other-info')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Candidate)
@Controller('other-info')
export class OtherInfoController {
  constructor(private readonly service: OtherInfoService) {}

  @Post()
  @ApiOperation({ summary: 'Thêm thông tin bổ sung vào hồ sơ ứng viên' })
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateOtherInfoDto) {
    return this.service.createForUser(user.userId, { ...dto });
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách thông tin bổ sung của ứng viên hiện tại' })
  findAll(@CurrentUser() user: AuthUserPayload, @Query() q: PaginationDto) {
    return this.service.findAllByUser(user.userId, q.page, q.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết thông tin bổ sung' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.service.findOneForUser(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin bổ sung' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateOtherInfoDto,
  ) {
    return this.service.updateForUser(id, user.userId, { ...dto });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thông tin bổ sung' })
  remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.service.removeForUser(id, user.userId);
  }
}
