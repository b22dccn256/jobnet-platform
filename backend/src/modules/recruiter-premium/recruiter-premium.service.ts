import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum';
import { AuthUserPayload } from '../../common/interfaces/auth-user.interface';
import { CompanyService } from '../companies/companies.service';
import { QueryRecruiterPremiumDto } from './dto/recruiter-premium.dto';
import { RecruiterPremium, RecruiterPremiumDocument } from './schemas/recruiter-premium.schema';

@Injectable()
export class RecruiterPremiumService {
  constructor(
    @InjectModel(RecruiterPremium.name)
    private readonly model: Model<RecruiterPremiumDocument>,
    private readonly companyService: CompanyService,
  ) {}

  createPendingOrder(companyId: Types.ObjectId | string, packageId: string, paymentRef: string) {
    return this.model.create({
      company: new Types.ObjectId(String(companyId)),
      package: new Types.ObjectId(packageId),
      paymentRef,
      paymentStatus: 'pending',
    });
  }

  findByPaymentRef(paymentRef: string) {
    return this.model.findOne({ paymentRef }).exec();
  }

  activateOrder(orderId: Types.ObjectId | string, durationDays: number, postLimit: number) {
    const startAt = new Date();
    const endAt = new Date(startAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
    return this.model
      .findByIdAndUpdate(
        orderId,
        {
          paymentStatus: 'success',
          startAt,
          endAt,
          remainingPosts: postLimit,
        },
        { new: true },
      )
      .populate('package', 'name price durationDays postLimit features')
      .exec();
  }

  markFailed(orderId: Types.ObjectId | string) {
    return this.model
      .findByIdAndUpdate(orderId, { paymentStatus: 'failed' }, { new: true })
      .exec();
  }

  findActiveByCompany(companyId: Types.ObjectId | string) {
    return this.model
      .findOne({
        company: new Types.ObjectId(String(companyId)),
        paymentStatus: 'success',
        endAt: { $gt: new Date() },
        remainingPosts: { $gt: 0 },
      })
      .sort({ endAt: -1 })
      .populate('package', 'name price durationDays postLimit features')
      .exec();
  }

  async getActiveForUser(userId: string) {
    const company = await this.companyService.findOptionalByUser(userId);
    if (!company) {
      return { active: false, subscription: null };
    }
    const subscription = await this.findActiveByCompany(company._id);
    return { active: Boolean(subscription), subscription };
  }

  async findMyOrders(userId: string, query: QueryRecruiterPremiumDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const company = await this.companyService.findOptionalByUser(userId);
    if (!company) {
      return { items: [], total: 0, page, limit };
    }

    const filter: Record<string, unknown> = { company: company._id };
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('package', 'name price durationDays postLimit')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async findAll(query: QueryRecruiterPremiumDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const filter: Record<string, unknown> = {};
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('company', 'name logo')
        .populate('package', 'name price durationDays postLimit')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async findOneAuthorized(id: string, actor: AuthUserPayload) {
    const doc = await this.model
      .findById(id)
      .populate('company', 'name user')
      .populate('package', 'name price durationDays postLimit features')
      .exec();
    if (!doc) throw new NotFoundException('Không tìm thấy đơn gói dịch vụ');

    if (actor.role === Role.Admin) return doc;

    const ownerId = (doc.company as unknown as { user?: Types.ObjectId })?.user;
    if (!ownerId || String(ownerId) !== actor.userId) {
      throw new ForbiddenException('Bạn không có quyền xem đơn dịch vụ này');
    }
    return doc;
  }
}
