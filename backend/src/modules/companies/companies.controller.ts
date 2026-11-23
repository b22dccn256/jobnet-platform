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
import { CompanyService } from './companies.service';
import { CreateCompanyDto, QueryCompanyDto, UpdateCompanyDto } from './dto/company.dto';

// Phụ trách: Tuấn
@ApiTags('companies')
@Controller('companies')
export class CompanyController {
  constructor(private readonly service: CompanyService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Employer)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo hồ sơ công ty cho nhà tuyển dụng' })
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateCompanyDto) {
    return this.service.createForUser(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách công ty (Công khai)' })
  findAll(@Query() q: QueryCompanyDto) {
    return this.service.findAll(q);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Employer)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy hồ sơ công ty của nhà tuyển dụng hiện tại' })
  myCompany(@CurrentUser() user: AuthUserPayload) {
    return this.service.findByUser(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết công ty (Công khai)' })
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Employer, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật hồ sơ công ty (Chủ công ty hoặc Admin)' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.service.updateWithOwnership(id, user, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Employer, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa công ty (Chủ công ty hoặc Admin)' })
  remove(@Param('id', ParseObjectIdPipe) id: string, @CurrentUser() user: AuthUserPayload) {
    return this.service.removeWithOwnership(id, user);
  }
}
