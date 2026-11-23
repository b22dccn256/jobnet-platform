import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SendMailDto, TestMailDto } from './dto/mail.dto';
import { MailService } from './mail.service';

// Phụ trách: Tuấn
@ApiTags('mail')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mail')
export class MailController {
  constructor(private readonly service: MailService) {}

  @Post('test')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Kiểm tra gửi email thử nghiệm (Admin)' })
  async sendTest(@Body() dto: TestMailDto) {
    return this.service.sendTest(dto.to);
  }

  @Post('send')
  @Roles(Role.Employer, Role.Admin)
  @ApiOperation({ summary: 'Gửi email cho ứng viên (Nhà tuyển dụng / Admin)' })
  async send(@Body() dto: SendMailDto) {
    return this.service.send(dto.to, dto.subject, dto.html);
  }
}
