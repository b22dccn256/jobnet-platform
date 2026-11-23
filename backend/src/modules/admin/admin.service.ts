import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobStatus } from '../../common/enums/job-status.enum';
import { Role } from '../../common/enums/role.enum';
import { escapeRegex } from '../../common/utils/string.util';
import { Application, ApplicationDocument } from '../applications/schemas/applications.schema';
import { Company, CompanyDocument } from '../companies/schemas/companies.schema';
import { Job, JobDocument } from '../jobs/schemas/jobs.schema';
import {
  RecruiterPremium,
  RecruiterPremiumDocument,
} from '../recruiter-premium/schemas/recruiter-premium.schema';
import { SearchService } from '../search/search.service';
import { User, UserDocument } from '../users/schemas/users.schema';
import {
  AdminJobsQueryDto,
  AdminUsersQueryDto,
  ModerateJobDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(Application.name) private readonly applicationModel: Model<ApplicationDocument>,
    @InjectModel(RecruiterPremium.name)
    private readonly premiumOrderModel: Model<RecruiterPremiumDocument>,
    private readonly searchService: SearchService,
  ) {}

  async listUsers(query: AdminUsersQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const filter: Record<string, unknown> = {};

    if (query.role) filter.role = query.role;
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.q?.trim()) {
      const regex = new RegExp(escapeRegex(query.q.trim()), 'i');
      filter.$or = [{ email: regex }, { fullName: regex }];
    }

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async updateUserStatus(id: string, actorId: string, dto: UpdateUserStatusDto) {
    if (id === actorId && !dto.isActive) {
      throw new BadRequestException('Không thể tự khóa tài khoản của chính mình');
    }
    const doc = await this.userModel
      .findByIdAndUpdate(id, { isActive: dto.isActive }, { new: true })
      .exec();
    if (!doc) throw new NotFoundException('Không tìm thấy người dùng');
    return doc;
  }

  async updateUserRole(id: string, actorId: string, dto: UpdateUserRoleDto) {
    if (id === actorId && dto.role !== Role.Admin) {
      throw new BadRequestException('Không thể tự hạ quyền quản trị của chính mình');
    }
    const doc = await this.userModel
      .findByIdAndUpdate(id, { role: dto.role }, { new: true })
      .exec();
    if (!doc) throw new NotFoundException('Không tìm thấy người dùng');
    return doc;
  }

  async listJobs(query: AdminJobsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const filter: Record<string, unknown> = {};

    if (query.status) filter.status = query.status;
    if (query.q?.trim()) {
      const regex = new RegExp(escapeRegex(query.q.trim()), 'i');
      filter.$or = [{ title: regex }, { location: regex }, { skills: regex }];
    }

    const [items, total] = await Promise.all([
      this.jobModel
        .find(filter)
        .populate('company', 'name logo address')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.jobModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async moderateJob(id: string, dto: ModerateJobDto) {
    if (!dto.approve && !dto.reason?.trim()) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối tin tuyển dụng');
    }

    const nextStatus = dto.approve ? JobStatus.Approved : JobStatus.Rejected;
    const updated = await this.jobModel
      .findByIdAndUpdate(
        id,
        {
          status: nextStatus,
          rejectReason: dto.approve ? '' : dto.reason?.trim(),
        },
        { new: true },
      )
      .populate('company', 'name logo address')
      .populate('category', 'name slug')
      .exec();

    if (!updated) throw new NotFoundException('Không tìm thấy tin tuyển dụng');

    try {
      if (dto.approve) {
        await this.searchService.indexJob(updated);
      } else {
        await this.searchService.removeJob(id);
      }
    } catch (error) {
      this.logger.warn(
        `Search index sync skipped for job ${id}: ${(error as Error).message}`,
      );
    }

    return updated;
  }

  async report() {
    const [
      totalUsers,
      activeUsers,
      candidates,
      employers,
      admins,
      totalCompanies,
      totalJobs,
      pendingJobs,
      approvedJobs,
      rejectedJobs,
      closedJobs,
      totalApplications,
      revenueStats,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ isActive: true }),
      this.userModel.countDocuments({ role: Role.Candidate }),
      this.userModel.countDocuments({ role: Role.Employer }),
      this.userModel.countDocuments({ role: Role.Admin }),
      this.companyModel.countDocuments(),
      this.jobModel.countDocuments(),
      this.jobModel.countDocuments({ status: JobStatus.Pending }),
      this.jobModel.countDocuments({ status: JobStatus.Approved }),
      this.jobModel.countDocuments({ status: JobStatus.Rejected }),
      this.jobModel.countDocuments({ status: JobStatus.Closed }),
      this.applicationModel.countDocuments(),
      this.premiumOrderModel.aggregate([
        { $match: { paymentStatus: 'success' } },
        {
          $lookup: {
            from: 'premium_packages',
            localField: 'package',
            foreignField: '_id',
            as: 'packageInfo',
          },
        },
        { $unwind: { path: '$packageInfo', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $ifNull: ['$packageInfo.price', 0] } },
            ordersCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const revenueSummary = revenueStats[0] || { totalRevenue: 0, ordersCount: 0 };

    return {
      revenue: revenueSummary.totalRevenue,
      premiumOrders: revenueSummary.ordersCount,
      users: {
        total: totalUsers,
        active: activeUsers,
        candidates,
        employers,
        admins,
      },
      companies: totalCompanies,
      jobs: {
        total: totalJobs,
        pending: pendingJobs,
        approved: approvedJobs,
        rejected: rejectedJobs,
        closed: closedJobs,
      },
      applications: totalApplications,
    };
  }
}
