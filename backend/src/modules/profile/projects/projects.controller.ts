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
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectService } from './projects.service';

// Phụ trách: Hà
@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Candidate)
@Controller('projects')
export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Thêm dự án cá nhân vào hồ sơ ứng viên' })
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateProjectDto) {
    return this.service.createForUser(user.userId, {
      ...dto,
      technologies: dto.technologies?.map((t) => t.trim()).filter(Boolean) || [],
    });
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách dự án của ứng viên hiện tại' })
  findAll(@CurrentUser() user: AuthUserPayload, @Query() q: PaginationDto) {
    return this.service.findAllByUser(user.userId, q.page, q.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết một dự án' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.service.findOneForUser(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật dự án của ứng viên' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.service.updateForUser(id, user.userId, {
      ...dto,
      ...(dto.technologies !== undefined
        ? { technologies: dto.technologies.map((t) => t.trim()).filter(Boolean) }
        : {}),
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa dự án của ứng viên' })
  remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.service.removeForUser(id, user.userId);
  }
}
