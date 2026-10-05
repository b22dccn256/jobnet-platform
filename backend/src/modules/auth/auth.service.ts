import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import { UserService } from '../users/users.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly users: UserService, private readonly jwt: JwtService) {}

  async register(dto: RegisterDto) {
    if (dto.role === Role.Admin) throw new ForbiddenException('Không thể tự đăng ký quản trị viên');
    if (await this.users.findByEmail(dto.email)) throw new ConflictException('Email đã tồn tại');
    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({ ...dto, password });
    return { id: user._id, email: user.email, role: user.role };
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

  async forgotPassword(_dto: ForgotPasswordDto) {
    // TODO (Tuấn): tạo token reset, lưu hạn dùng, gửi mail qua MailService
    return { message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi' };
  }

  async resetPassword(_dto: ResetPasswordDto) {
    // TODO (Tuấn): xác thực token, đổi mật khẩu
    return { message: 'TODO' };
  }
}
