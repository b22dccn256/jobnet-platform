import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobStatus } from '../../common/enums/job-status.enum';
import { Role } from '../../common/enums/role.enum';
import { AuthUserPayload } from '../../common/interfaces/auth-user.interface';
import { escapeRegex } from '../../common/utils/string.util';
import { CategoryService } from '../categories/categories.service';
import { CompanyService } from '../companies/companies.service';
import { SearchService } from '../search/search.service';
import { CreateJobDto, EmployerQueryJobDto, QueryJobDto, UpdateJobDto } from './dto/job.dto';
import { Job, JobDocument } from './schemas/jobs.schema';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    @InjectModel(Job.name) private readonly model: Model<JobDocument>,
    private readonly companyService: CompanyService,
    private readonly categoryService: CategoryService,
    private readonly searchService: SearchService,
  ) {}

  private validateSalaryRange(salaryMin?: number, salaryMax?: number) {
    if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax) {
      throw new BadRequestException('Mức lương tối thiểu không được lớn hơn mức lương tối đa');
    }
  }

  private normalizeSkills(skills?: string[]) {
    if (!skills) return undefined;
    return Array.from(new Set(skills.map((s) => s.trim()).filter(Boolean)));
  }

  private async safeRemoveFromSearch(id: string) {
    try {
      await this.searchService.removeJob(id);
    } catch (error) {
      this.logger.warn(`Could not remove job ${id} from search index: ${(error as Error).message}`);
    }
  }

  private assertJobOwnerOrAdmin(job: JobDocument, actor: AuthUserPayload) {
    if (actor.role === Role.Admin) return;
    const companyOwnerId = (job.company as unknown as { user?: Types.ObjectId })?.user;
    if (!companyOwnerId || String(companyOwnerId) !== actor.userId) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên tin tuyển dụng này');
    }
  }

  async createForEmployer(userId: string, dto: CreateJobDto) {
    const company = await this.companyService.findOptionalByUser(userId);
    if (!company) {
      throw new BadRequestException('Vui lòng tạo hồ sơ công ty trước khi đăng tin tuyển dụng');
    }

    if (dto.category) {
      await this.categoryService.findOne(dto.category);
    }
    this.validateSalaryRange(dto.salaryMin, dto.salaryMax);

    return this.model.create({
      ...dto,
      title: dto.title.trim(),
      skills: this.normalizeSkills(dto.skills) || [],
      company: company._id,
      category: dto.category ? new Types.ObjectId(dto.category) : undefined,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      status: JobStatus.Pending,
    });
  }

  async findPublic(query: QueryJobDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const andConditions: Record<string, unknown>[] = [
      { status: JobStatus.Approved },
      {
        $or: [
          { deadline: { $exists: false } },
          { deadline: null },
          { deadline: { $gte: new Date() } },
        ],
      },
    ];

    if (query.q?.trim()) {
      const regex = new RegExp(escapeRegex(query.q.trim()), 'i');
      andConditions.push({
        $or: [{ title: regex }, { location: regex }, { skills: regex }],
      });
    }
    if (query.category) {
      andConditions.push({ category: new Types.ObjectId(query.category) });
    }
    if (query.company) {
      andConditions.push({ company: new Types.ObjectId(query.company) });
    }
    if (query.location?.trim()) {
      andConditions.push({ location: new RegExp(escapeRegex(query.location.trim()), 'i') });
    }
    if (query.workMode) {
      andConditions.push({ workMode: query.workMode });
    }
    if (query.level) {
      andConditions.push({ level: query.level });
    }
    if (query.skills?.trim()) {
      const skillRegexes = query.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i'));
      if (skillRegexes.length > 0) {
        andConditions.push({ skills: { $in: skillRegexes } });
      }
    }
    if (query.salaryMin !== undefined) {
      andConditions.push({
        $or: [
          { salaryMax: { $gte: query.salaryMin } },
          { salaryMin: { $gte: query.salaryMin } },
        ],
      });
    }
    if (query.salaryMax !== undefined) {
      andConditions.push({
        $or: [
          { salaryMin: { $lte: query.salaryMax } },
          { salaryMax: { $lte: query.salaryMax } },
        ],
      });
    }

    const filter = { $and: andConditions };
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('company', 'name logo address industry size')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async findByEmployer(userId: string, query: EmployerQueryJobDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const company = await this.companyService.findOptionalByUser(userId);
    if (!company) {
      return { items: [], total: 0, page, limit };
    }

    const filter: Record<string, unknown> = { company: company._id };
    if (query.status) {
      filter.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async findOneAuthorized(id: string, actor?: AuthUserPayload | null) {
    const doc = await this.model
      .findById(id)
      .populate('company', 'name logo address website size industry user')
      .populate('category', 'name slug')
      .exec();
    if (!doc) throw new NotFoundException('Không tìm thấy tin tuyển dụng');

    if (doc.status === JobStatus.Approved) {
      return doc;
    }

    const ownerId = (doc.company as unknown as { user?: Types.ObjectId })?.user;
    const isOwner = !!actor && !!ownerId && String(ownerId) === actor.userId;
    const isAdmin = actor?.role === Role.Admin;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Tin tuyển dụng chưa được công khai');
    }

    return doc;
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).populate('company').populate('category').exec();
    if (!doc) throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    return doc;
  }

  async updateForEmployer(id: string, actor: AuthUserPayload, dto: UpdateJobDto) {
    const doc = await this.model.findById(id).populate('company', 'user').exec();
    if (!doc) throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    this.assertJobOwnerOrAdmin(doc, actor);

    if (dto.category) {
      await this.categoryService.findOne(dto.category);
    }

    const nextSalaryMin = dto.salaryMin !== undefined ? dto.salaryMin : doc.salaryMin;
    const nextSalaryMax = dto.salaryMax !== undefined ? dto.salaryMax : doc.salaryMax;
    this.validateSalaryRange(nextSalaryMin, nextSalaryMax);

    const updateData: Record<string, unknown> = {};
    if (dto.title !== undefined) updateData.title = dto.title.trim();
    if (dto.category !== undefined) updateData.category = new Types.ObjectId(dto.category);
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.benefits !== undefined) updateData.benefits = dto.benefits;
    if (dto.requirements !== undefined) updateData.requirements = dto.requirements;
    if (dto.skills !== undefined) updateData.skills = this.normalizeSkills(dto.skills);
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.workMode !== undefined) updateData.workMode = dto.workMode;
    if (dto.level !== undefined) updateData.level = dto.level;
    if (dto.education !== undefined) updateData.education = dto.education;
    if (dto.salaryMin !== undefined) updateData.salaryMin = dto.salaryMin;
    if (dto.salaryMax !== undefined) updateData.salaryMax = dto.salaryMax;
    if (dto.deadline !== undefined) updateData.deadline = new Date(dto.deadline);

    // Re-queue for admin moderation if a non-admin modifies an approved or rejected job.
    if (
      actor.role !== Role.Admin &&
      (doc.status === JobStatus.Approved || doc.status === JobStatus.Rejected)
    ) {
      updateData.status = JobStatus.Pending;
      updateData.rejectReason = '';
      if (doc.status === JobStatus.Approved) {
        await this.safeRemoveFromSearch(id);
      }
    }

    return this.model
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('company', 'name logo address')
      .populate('category', 'name slug')
      .exec();
  }

  async closeForEmployer(id: string, actor: AuthUserPayload) {
    const doc = await this.model.findById(id).populate('company', 'user').exec();
    if (!doc) throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    this.assertJobOwnerOrAdmin(doc, actor);

    const updated = await this.model
      .findByIdAndUpdate(id, { status: JobStatus.Closed }, { new: true })
      .exec();
    await this.safeRemoveFromSearch(id);
    return updated;
  }

  async removeForEmployer(id: string, actor: AuthUserPayload) {
    const doc = await this.model.findById(id).populate('company', 'user').exec();
    if (!doc) throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    this.assertJobOwnerOrAdmin(doc, actor);

    await this.model.findByIdAndDelete(id).exec();
    await this.safeRemoveFromSearch(id);
    return { deleted: true };
  }
}
