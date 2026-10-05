import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MailService } from './mail.service';

// Phụ trách: Tuấn
@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly service: MailService) {}


  @Post('send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  send(@Body() body: { to: string; subject: string; html: string }) {
    // TODO (Tuấn): chỉ employer được gửi cho ứng viên đã ứng tuyển vào tin của mình
    return this.service.send(body.to, body.subject, body.html);
  }

}
