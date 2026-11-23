import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUserPayload } from '../../common/interfaces/auth-user.interface';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { CompanyFollowService } from './company-follows.service';

// Phụ trách: Hà
@ApiTags('company-follows')
@Controller('company-follows')
export class CompanyFollowController {
  constructor(private readonly service: CompanyFollowService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Candidate)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách công ty ứng viên đang theo dõi' })
  findMine(@CurrentUser() user: AuthUserPayload, @Query() q: PaginationDto) {
    return this.service.findMine(user.userId, q.page, q.limit);
  }

  @Get('check/:companyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Candidate)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra ứng viên đã theo dõi công ty này chưa' })
  check(
    @CurrentUser() user: AuthUserPayload,
    @Param('companyId', ParseObjectIdPipe) companyId: string,
  ) {
    return this.service.isFollowing(user.userId, companyId);
  }

  @Get('company/:companyId/count')
  @ApiOperation({ summary: 'Số lượng người theo dõi một công ty (Công khai)' })
  count(@Param('companyId', ParseObjectIdPipe) companyId: string) {
    return this.service.countFollowers(companyId);
  }

  @Post(':companyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Candidate)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Theo dõi công ty (Ứng viên)' })
  follow(
    @CurrentUser() user: AuthUserPayload,
    @Param('companyId', ParseObjectIdPipe) companyId: string,
  ) {
    return this.service.follow(user.userId, companyId);
  }

  @Delete(':companyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Candidate)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hủy theo dõi công ty (Ứng viên)' })
  unfollow(
    @CurrentUser() user: AuthUserPayload,
    @Param('companyId', ParseObjectIdPipe) companyId: string,
  ) {
    return this.service.unfollow(user.userId, companyId);
  }
}
