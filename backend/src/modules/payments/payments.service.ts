import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { CompanyService } from '../companies/companies.service';
import { PremiumPackageService } from '../premium-packages/premium-packages.service';
import { RecruiterPremiumService } from '../recruiter-premium/recruiter-premium.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly cfg: ConfigService,
    private readonly companyService: CompanyService,
    private readonly packageService: PremiumPackageService,
    private readonly recruiterPremiumService: RecruiterPremiumService,
  ) {}

  private formatVnpayDate(date: Date): string {
    // VNPay requires yyyyMMddHHmmss in GMT+7
    const vn = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${vn.getUTCFullYear()}` +
      `${pad(vn.getUTCMonth() + 1)}` +
      `${pad(vn.getUTCDate())}` +
      `${pad(vn.getUTCHours())}` +
      `${pad(vn.getUTCMinutes())}` +
      `${pad(vn.getUTCSeconds())}`
    );
  }

  /** Sort parameters alphabetically and build VNPay encoded query + HMAC-SHA512 signature. */
  signParams(params: Record<string, string>, secret: string): { query: string; secureHash: string } {
    const sortedKeys = Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== '')
      .sort();

    const signData = sortedKeys
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
      .join('&');

    const secureHash = crypto.createHmac('sha512', secret).update(signData, 'utf8').digest('hex');
    return { query: `${signData}&vnp_SecureHash=${secureHash}`, secureHash };
  }

  verifySignature(query: Record<string, string>): boolean {
    const secret = (this.cfg.get<string>('VNPAY_HASH_SECRET') || '').trim();
    const receivedHash = query.vnp_SecureHash || '';

    if (!secret) {
      return receivedHash === 'MOCK_VALID';
    }
    if (!receivedHash) return false;

    const cleanParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(query)) {
      if (k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType' && v !== undefined) {
        cleanParams[k] = String(v);
      }
    }

    const { secureHash } = this.signParams(cleanParams, secret);
    const a = Buffer.from(secureHash.toLowerCase(), 'utf8');
    const b = Buffer.from(receivedHash.toLowerCase(), 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  async createVnpayUrl(userId: string, packageId: string, ip: string) {
    const company = await this.companyService.findOptionalByUser(userId);
    if (!company) {
      throw new BadRequestException('Vui lòng tạo hồ sơ công ty trước khi mua gói dịch vụ');
    }

    const pkg = await this.packageService.findOne(packageId);
    const paymentRef = `JOBNET${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    await this.recruiterPremiumService.createPendingOrder(company._id, String(pkg._id), paymentRef);

    const tmnCode = (this.cfg.get<string>('VNPAY_TMN_CODE') || '').trim();
    const hashSecret = (this.cfg.get<string>('VNPAY_HASH_SECRET') || '').trim();
    const vnpUrl =
      this.cfg.get<string>('VNPAY_URL') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl =
      this.cfg.get<string>('VNPAY_RETURN_URL') ||
      'http://localhost:3000/employer/payment/vnpay-return';
    const amount = String(Math.round(pkg.price * 100));

    if (!tmnCode || !hashSecret) {
      this.logger.warn(
        `VNPay credentials not configured. Returning dev mock payment URL for ref ${paymentRef}`,
      );
      const mockQuery = new URLSearchParams({
        vnp_TxnRef: paymentRef,
        vnp_Amount: amount,
        vnp_ResponseCode: '00',
        vnp_TransactionStatus: '00',
        vnp_OrderInfo: `Thanh toan goi ${pkg.name}`,
        vnp_SecureHash: 'MOCK_VALID',
      }).toString();

      return {
        mode: 'mock',
        paymentRef,
        amount: pkg.price,
        paymentUrl: `${returnUrl}?${mockQuery}`,
      };
    }

    const clientIp = ip === '::1' || !ip ? '127.0.0.1' : ip.replace('::ffff:', '');
    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: paymentRef,
      vnp_OrderInfo: `Thanh toan goi ${pkg.name}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: clientIp,
      vnp_CreateDate: this.formatVnpayDate(new Date()),
    };

    const { query } = this.signParams(params, hashSecret);
    return {
      mode: 'vnpay',
      paymentRef,
      amount: pkg.price,
      paymentUrl: `${vnpUrl}?${query}`,
    };
  }

  async handleVnpayReturn(query: Record<string, string>) {
    if (!this.verifySignature(query)) {
      throw new BadRequestException('Chữ ký thanh toán VNPay không hợp lệ');
    }

    const txnRef = query.vnp_TxnRef;
    if (!txnRef) {
      throw new BadRequestException('Thiếu mã giao dịch vnp_TxnRef');
    }

    const order = await this.recruiterPremiumService.findByPaymentRef(txnRef);
    if (!order) {
      throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    }

    if (order.paymentStatus === 'success') {
      return {
        success: true,
        alreadyProcessed: true,
        message: 'Giao dịch đã được xác nhận trước đó',
        order,
      };
    }

    const pkg = await this.packageService.findOne(String(order.package));
    const expectedAmount = Math.round(pkg.price * 100);
    if (query.vnp_Amount !== undefined && Number(query.vnp_Amount) !== expectedAmount) {
      throw new BadRequestException('Số tiền thanh toán VNPay không khớp với giá gói dịch vụ');
    }

    const isSuccess =
      query.vnp_ResponseCode === '00' &&
      (!query.vnp_TransactionStatus || query.vnp_TransactionStatus === '00');

    if (!isSuccess) {
      const failed = await this.recruiterPremiumService.markFailed(order._id);
      return {
        success: false,
        code: query.vnp_ResponseCode,
        message: 'Thanh toán không thành công hoặc đã bị hủy',
        order: failed,
      };
    }

    const activated = await this.recruiterPremiumService.activateOrder(
      order._id,
      pkg.durationDays || 30,
      pkg.postLimit || 10,
    );

    return {
      success: true,
      message: 'Thanh toán thành công và đã kích hoạt gói dịch vụ',
      order: activated,
    };
  }

  async handleVnpayIpn(query: Record<string, string>) {
    try {
      const result = await this.handleVnpayReturn(query);
      return result.success
        ? { RspCode: '00', Message: 'Confirm Success' }
        : { RspCode: '00', Message: 'Transaction Failed Recorded' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { RspCode: '01', Message: 'Order not found' };
      }
      if (error instanceof BadRequestException && error.message.includes('Số tiền')) {
        return { RspCode: '04', Message: 'Invalid amount' };
      }
      return { RspCode: '97', Message: 'Invalid signature or request' };
    }
  }
}
