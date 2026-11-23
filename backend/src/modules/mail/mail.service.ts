import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;
  private readonly isConfigured: boolean;

  constructor(private readonly cfg: ConfigService) {
    const host = cfg.get<string>('MAIL_HOST');
    const port = Number(cfg.get<string>('MAIL_PORT') || 587);
    const user = cfg.get<string>('MAIL_USER');
    const pass = cfg.get<string>('MAIL_PASS');
    this.from = cfg.get<string>('MAIL_FROM') || 'JobNet <no-reply@jobnet.local>';

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: host || 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.isConfigured = true;
      this.logger.log(`Nodemailer initialized successfully for ${user}`);
    } else {
      this.isConfigured = false;
      this.logger.warn(
        'MAIL_USER or MAIL_PASS is not configured in .env. Emails will be logged to console in Dev Mode.',
      );
    }
  }

  async send(to: string, subject: string, html: string) {
    if (!this.isConfigured || !this.transporter) {
      this.logger.warn(`[DEV MAIL MOCK] To: ${to} | Subject: ${subject}`);
      return { success: true, mocked: true, messageId: `mock-${Date.now()}` };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return { success: true, mocked: false, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  async sendResetPasswordEmail(to: string, resetUrl: string, fullName?: string) {
    const name = fullName ? fullName : 'Quý khách';
    const subject = 'JobNet – Yêu cầu đặt lại mật khẩu';
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 26px; font-weight: 700;">JobNet</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Nền tảng hỗ trợ tìm kiếm việc làm trực tuyến</p>
        </div>
        <div style="padding: 16px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">Xin chào <strong>${name}</strong>,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản JobNet liên kết với địa chỉ email <strong>${to}</strong>.
          </p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            Vui lòng nhấn vào nút bên dưới để tiến hành thiết lập mật khẩu mới:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
              Đặt lại mật khẩu
            </a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
            Đường dẫn trên sẽ hết hiệu lực sau <strong>15 phút</strong>.
          </p>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
            Nếu nút bấm trên không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:<br>
            <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        <div style="margin-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
          <p style="margin: 4px 0;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và mật khẩu của bạn vẫn an toàn.</p>
          <p style="margin: 4px 0;">&copy; ${new Date().getFullYear()} JobNet. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.send(to, subject, html);
  }

  async sendTest(to: string) {
    const subject = 'JobNet – Thử nghiệm gửi email hệ thống';
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #10b981; border-radius: 8px;">
        <h2 style="color: #10b981;">Kết nối Mail Service thành công!</h2>
        <p>Hệ thống gửi email của <strong>JobNet</strong> đã được thiết lập và hoạt động chuẩn xác.</p>
        <p>Thời gian gửi: <strong>${new Date().toLocaleString('vi-VN')}</strong></p>
      </div>
    `;
    return this.send(to, subject, html);
  }
}
