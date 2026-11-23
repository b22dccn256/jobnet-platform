import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUserPayload } from '../../common/interfaces/auth-user.interface';
import { CreateVnpayUrlDto } from './dto/payment.dto';
import { PaymentService } from './payments.service';

// Phụ trách: Tuấn
@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Post('vnpay/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Employer)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo URL thanh toán VNPay cho gói dịch vụ (Nhà tuyển dụng)' })
  create(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: CreateVnpayUrlDto,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    return this.service.createVnpayUrl(user.userId, dto.packageId, ip);
  }

  @Get('vnpay/return')
  @ApiOperation({ summary: 'Xử lý kết quả trả về từ cổng VNPay' })
  vnpayReturn(@Query() query: Record<string, string>) {
    return this.service.handleVnpayReturn(query);
  }

  @Get('vnpay/ipn')
  @ApiOperation({ summary: 'Webhook IPN xác nhận giao dịch từ VNPay' })
  vnpayIpn(@Query() query: Record<string, string>) {
    return this.service.handleVnpayIpn(query);
  }
}
