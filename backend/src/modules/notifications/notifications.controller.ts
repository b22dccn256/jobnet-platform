import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post('digest')
  @ApiOperation({ summary: 'Kích hoạt gửi email tổng hợp việc làm mới thủ công (Admin)' })
  @ApiQuery({ name: 'hours', required: false, example: 24 })
  triggerDigest(@Query('hours') hours?: string) {
    const parsedHours = Math.max(1, Math.min(720, Number(hours) || 24));
    return this.service.sendNewJobsDigest(parsedHours);
  }
}
