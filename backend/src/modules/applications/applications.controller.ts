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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUserPayload } from '../../common/interfaces/auth-user.interface';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { ApplicationService } from './applications.service';
import {
  CreateApplicationDto,
  QueryApplicationDto,
  UpdateApplicationStatusDto,
} from './dto/application.dto';

// Phụ trách: Hà (ứng viên) & Tuấn (nhà tuyển dụng)
@ApiTags('applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationController {
  constructor(private readonly service: ApplicationService) {}

  @Post()
  @Roles(Role.Candidate)
  @ApiOperation({ summary: 'Ứng tuyển vào tin tuyển dụng (Ứng viên)' })
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateApplicationDto) {
    return this.service.apply(user.userId, dto);
  }

  @Get('me')
  @Roles(Role.Candidate)
  @ApiOperation({ summary: 'Xem lịch sử ứng tuyển của bản thân (Ứng viên)' })
  myApplications(@CurrentUser() user: AuthUserPayload, @Query() q: QueryApplicationDto) {
    return this.service.findMyApplications(user.userId, q);
  }

  @Get('employer')
  @Roles(Role.Employer)
  @ApiOperation({ summary: 'Danh sách đơn ứng tuyển vào các tin của công ty (Nhà tuyển dụng)' })
  employerApplications(@CurrentUser() user: AuthUserPayload, @Query() q: QueryApplicationDto) {
    return this.service.findForEmployer(user.userId, q);
  }

  @Get('job/:jobId')
  @Roles(Role.Employer, Role.Admin)
  @ApiOperation({ summary: 'Danh sách ứng viên ứng tuyển theo tin tuyển dụng' })
  byJob(
    @Param('jobId', ParseObjectIdPipe) jobId: string,
    @CurrentUser() user: AuthUserPayload,
    @Query() q: QueryApplicationDto,
  ) {
    return this.service.findByJob(jobId, user, q);
  }

  @Get(':id')
  @Roles(Role.Candidate, Role.Employer, Role.Admin)
  @ApiOperation({ summary: 'Chi tiết một đơn ứng tuyển' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.service.findOneAuthorized(id, user);
  }

  @Patch(':id/status')
  @Roles(Role.Employer, Role.Admin)
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn ứng tuyển (Nhà tuyển dụng / Admin)' })
  updateStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.service.updateStatus(id, user, dto);
  }

  @Delete(':id')
  @Roles(Role.Candidate, Role.Admin)
  @ApiOperation({ summary: 'Rút đơn ứng tuyển (Ứng viên) hoặc xóa (Admin)' })
  remove(@Param('id', ParseObjectIdPipe) id: string, @CurrentUser() user: AuthUserPayload) {
    return this.service.withdraw(id, user);
  }
}
