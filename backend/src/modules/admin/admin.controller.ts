import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUserPayload } from '../../common/interfaces/auth-user.interface';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { AdminService } from './admin.service';
import {
  AdminJobsQueryDto,
  AdminUsersQueryDto,
  ModerateJobDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/admin.dto';

// Phụ trách: Tuấn
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Danh sách tài khoản người dùng (Admin)' })
  users(@Query() q: AdminUsersQueryDto) {
    return this.service.listUsers(q);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Khóa hoặc mở khóa tài khoản người dùng (Admin)' })
  updateUserStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() actor: AuthUserPayload,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.service.updateUserStatus(id, actor.userId, dto);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Cập nhật phân quyền tài khoản (Admin)' })
  updateUserRole(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() actor: AuthUserPayload,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.service.updateUserRole(id, actor.userId, dto);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Danh sách tin tuyển dụng phục vụ kiểm duyệt (Admin)' })
  jobs(@Query() q: AdminJobsQueryDto) {
    return this.service.listJobs(q);
  }

  @Patch('jobs/:id/moderate')
  @ApiOperation({ summary: 'Duyệt hoặc từ chối tin tuyển dụng (Admin)' })
  moderate(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: ModerateJobDto) {
    return this.service.moderateJob(id, dto);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Báo cáo thống kê hệ thống và doanh thu VNPay (Admin)' })
  report() {
    return this.service.report();
  }
}
