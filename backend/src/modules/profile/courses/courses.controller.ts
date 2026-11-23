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
import { CourseService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';

// Phụ trách: Hà
@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Candidate)
@Controller('courses')
export class CourseController {
  constructor(private readonly service: CourseService) {}

  @Post()
  @ApiOperation({ summary: 'Thêm khóa học / chứng chỉ của ứng viên' })
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateCourseDto) {
    return this.service.createForUser(user.userId, { ...dto });
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách khóa học của ứng viên hiện tại' })
  findAll(@CurrentUser() user: AuthUserPayload, @Query() q: PaginationDto) {
    return this.service.findAllByUser(user.userId, q.page, q.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết một khóa học của ứng viên' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.service.findOneForUser(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật khóa học của ứng viên' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.service.updateForUser(id, user.userId, { ...dto });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa khóa học của ứng viên' })
  remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.service.removeForUser(id, user.userId);
  }
}
