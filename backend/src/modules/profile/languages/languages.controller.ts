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
import { CreateLanguageDto, UpdateLanguageDto } from './dto/language.dto';
import { LanguageService } from './languages.service';

// Phụ trách: Hà
@ApiTags('languages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Candidate)
@Controller('languages')
export class LanguageController {
  constructor(private readonly service: LanguageService) {}

  @Post()
  @ApiOperation({ summary: 'Thêm ngoại ngữ của ứng viên' })
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateLanguageDto) {
    return this.service.createForUser(user.userId, { ...dto });
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách ngoại ngữ của ứng viên hiện tại' })
  findAll(@CurrentUser() user: AuthUserPayload, @Query() q: PaginationDto) {
    return this.service.findAllByUser(user.userId, q.page, q.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết một mục ngoại ngữ' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.service.findOneForUser(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật ngoại ngữ của ứng viên' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateLanguageDto,
  ) {
    return this.service.updateForUser(id, user.userId, { ...dto });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa ngoại ngữ của ứng viên' })
  remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.service.removeForUser(id, user.userId);
  }
}
