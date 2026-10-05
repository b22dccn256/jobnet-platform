import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentService {

  /** TODO (Tuấn): tạo URL thanh toán VNPay (ký HMAC SHA512 với VNPAY_HASH_SECRET) */
  async createVnpayUrl(_userId: string, _packageId: string, _ip: string) {
    return { paymentUrl: 'TODO' };
  }

  /** TODO (Tuấn): xác thực chữ ký, cập nhật recruiter_premium */
  async handleVnpayReturn(_query: Record<string, string>) {
    return { success: false, message: 'TODO' };
  }

}
