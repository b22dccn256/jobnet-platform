import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum';
import { AuthUserPayload } from '../../common/interfaces/auth-user.interface';
import { escapeRegex } from '../../common/utils/string.util';
import { CreateCompanyDto, QueryCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { Company, CompanyDocument } from './schemas/companies.schema';

@Injectable()
export class CompanyService {
  constructor(@InjectModel(Company.name) private readonly model: Model<CompanyDocument>) {}

  async createForUser(userId: string, dto: CreateCompanyDto) {
    const existing = await this.findOptionalByUser(userId);
    if (existing) {
      throw new ConflictException('Tài khoản nhà tuyển dụng đã có hồ sơ công ty');
    }

    return this.model.create({
      ...dto,
      name: dto.name.trim(),
      user: new Types.ObjectId(userId),
    });
  }

  findOptionalByUser(userId: string) {
    return this.model.findOne({ user: new Types.ObjectId(userId) }).exec();
  }

  async findByUser(userId: string) {
    const doc = await this.findOptionalByUser(userId);
    if (!doc) throw new NotFoundException('Bạn chưa tạo hồ sơ công ty');
    return doc;
  }

  async findAll(query: QueryCompanyDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const filter: Record<string, unknown> = {};

    if (query.q?.trim()) {
      const regex = new RegExp(escapeRegex(query.q.trim()), 'i');
      filter.$or = [{ name: regex }, { industry: regex }, { address: regex }];
    }
    if (query.industry?.trim()) {
      filter.industry = new RegExp(escapeRegex(query.industry.trim()), 'i');
    }
    if (query.size?.trim()) {
      filter.size = new RegExp(escapeRegex(query.size.trim()), 'i');
    }

    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const doc = await this.model
      .findById(id)
      .populate('user', 'fullName email')
      .exec();
    if (!doc) throw new NotFoundException('Không tìm thấy công ty');
    return doc;
  }

  private assertOwnerOrAdmin(company: CompanyDocument, actor: AuthUserPayload) {
    if (actor.role === Role.Admin) return;
    if (String(company.user) !== actor.userId) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên công ty này');
    }
  }

  async updateWithOwnership(id: string, actor: AuthUserPayload, dto: UpdateCompanyDto) {
    const company = await this.model.findById(id).exec();
    if (!company) throw new NotFoundException('Không tìm thấy công ty');
    this.assertOwnerOrAdmin(company, actor);

    const cleanData = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    return this.model.findByIdAndUpdate(id, cleanData, { new: true }).exec();
  }

  async removeWithOwnership(id: string, actor: AuthUserPayload) {
    const company = await this.model.findById(id).exec();
    if (!company) throw new NotFoundException('Không tìm thấy công ty');
    this.assertOwnerOrAdmin(company, actor);

    await this.model.findByIdAndDelete(id).exec();
    return { deleted: true };
  }
}
