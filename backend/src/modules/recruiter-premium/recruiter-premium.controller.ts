import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUserPayload } from '../../common/interfaces/auth-user.interface';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { QueryRecruiterPremiumDto } from './dto/recruiter-premium.dto';
import { RecruiterPremiumService } from './recruiter-premium.service';

// Phụ trách: Tuấn
@ApiTags('recruiter-premium')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recruiter-premium')
export class RecruiterPremiumController {
  constructor(private readonly service: RecruiterPremiumService) {}

  @Get('me')
  @Roles(Role.Employer)
  @ApiOperation({ summary: 'Lịch sử mua gói dịch vụ của nhà tuyển dụng' })
  myOrders(@CurrentUser() user: AuthUserPayload, @Query() q: QueryRecruiterPremiumDto) {
    return this.service.findMyOrders(user.userId, q);
  }

  @Get('active')
  @Roles(Role.Employer)
  @ApiOperation({ summary: 'Kiểm tra gói dịch vụ Premium đang hoạt động của nhà tuyển dụng' })
  active(@CurrentUser() user: AuthUserPayload) {
    return this.service.getActiveForUser(user.userId);
  }

  @Get()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Danh sách toàn bộ giao dịch gói đăng tin (Admin)' })
  findAll(@Query() q: QueryRecruiterPremiumDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  @Roles(Role.Employer, Role.Admin)
  @ApiOperation({ summary: 'Chi tiết một đơn mua gói dịch vụ' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.service.findOneAuthorized(id, user);
  }
}
