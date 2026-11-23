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
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUserPayload } from '../../common/interfaces/auth-user.interface';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import {
  CreateJobDto,
  EmployerQueryJobDto,
  QueryJobDto,
  UpdateJobDto,
} from './dto/job.dto';
import { JobService } from './jobs.service';

// Phụ trách: Tuấn
@ApiTags('jobs')
@Controller('jobs')
export class JobController {
  constructor(private readonly service: JobService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Employer)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng tin tuyển dụng mới (Nhà tuyển dụng - chờ Admin duyệt)' })
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateJobDto) {
    return this.service.createForEmployer(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách tin tuyển dụng đã duyệt (Công khai)' })
  findAll(@Query() q: QueryJobDto) {
    return this.service.findPublic(q);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Employer)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách tin tuyển dụng của công ty hiện tại' })
  findMine(@CurrentUser() user: AuthUserPayload, @Query() q: EmployerQueryJobDto) {
    return this.service.findByEmployer(user.userId, q);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Chi tiết tin tuyển dụng' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload | null,
  ) {
    return this.service.findOneAuthorized(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Employer, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật tin tuyển dụng (Chủ tin hoặc Admin)' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateJobDto,
  ) {
    return this.service.updateForEmployer(id, user, dto);
  }

  @Patch(':id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Employer, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đóng tin tuyển dụng (Chủ tin hoặc Admin)' })
  close(@Param('id', ParseObjectIdPipe) id: string, @CurrentUser() user: AuthUserPayload) {
    return this.service.closeForEmployer(id, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Employer, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa tin tuyển dụng (Chủ tin hoặc Admin)' })
  remove(@Param('id', ParseObjectIdPipe) id: string, @CurrentUser() user: AuthUserPayload) {
    return this.service.removeForEmployer(id, user);
  }
}
