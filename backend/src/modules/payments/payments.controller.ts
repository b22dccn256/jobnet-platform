import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaymentService } from './payments.service';

// Phụ trách: Tuấn
@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}


  @Post('vnpay/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() body: { packageId: string }) {
    return this.service.createVnpayUrl('TODO-userId', body.packageId, '127.0.0.1');
  }

  @Get('vnpay/return')
  vnpayReturn(@Query() query: Record<string, string>) {
    return this.service.handleVnpayReturn(query);
  }

}
