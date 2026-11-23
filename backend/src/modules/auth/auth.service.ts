import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Role } from '../../common/enums/role.enum';
import { MailService } from '../mail/mail.service';
import { UserService } from '../users/users.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly cfg: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role === Role.Admin) throw new ForbiddenException('Không thể tự đăng ký quản trị viên');
    const normalizedEmail = dto.email.trim().toLowerCase();
    if (await this.users.findByEmail(normalizedEmail)) throw new ConflictException('Email đã tồn tại');
    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({ ...dto, email: normalizedEmail, password });
    const payload = { sub: String(user._id), email: user.email, role: user.role };
    return {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      accessToken: await this.jwt.signAsync(payload),
    };
  }

  getProfile(userId: string) {
    return this.users.findOne(userId);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email, true);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    if (!user.isActive) throw new ForbiddenException('Tài khoản đã bị khóa');
    const payload = { sub: String(user._id), email: user.email, role: user.role };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.users.findByEmail(dto.email);
    // Bảo vệ quyền riêng tư chống User Enumeration Attack: Luôn trả thông báo chung
    if (!user) {
      return { message: 'Nếu email tồn tại trên hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư.' };
    }

    // 1. Tạo token ngẫu nhiên bảo mật cao (32 bytes = 64 ký tự hex)
    const rawToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash token bằng SHA-256 trước khi lưu vào CSDL (OWASP standard)
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 3. Thời hạn hiệu lực: 15 phút
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await this.users.setResetToken(String(user._id), hashedToken, expires);

    // 4. Tạo đường dẫn và gửi email
    const frontendUrl = this.cfg.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    await this.mail.sendResetPasswordEmail(user.email, resetUrl, user.fullName);

    return { message: 'Nếu email tồn tại trên hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    // 1. Hash token nhận từ client để so khớp với token lưu trong DB
    const hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex');

    // 2. Tìm user có token khớp và còn hạn sử dụng
    const user = await this.users.findByResetToken(hashedToken);
    if (!user) {
      throw new BadRequestException('Mã xác thực không hợp lệ hoặc đã hết hạn.');
    }

    // 3. Băm mật khẩu mới và cập nhật, xóa token cũ
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.users.updatePassword(String(user._id), passwordHash);

    return { success: true, message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    // 1. Lấy thông tin người dùng kèm mật khẩu đã hash
    const user = await this.users.findByIdWithPassword(userId);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại.');
    }

    // 2. Xác thực mật khẩu cũ
    const isPasswordValid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác.');
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
    }

    // 3. Băm mật khẩu mới và lưu
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.users.updatePassword(userId, passwordHash);

    return { success: true, message: 'Đổi mật khẩu thành công.' };
  }
}
