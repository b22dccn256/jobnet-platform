import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { JobStatus } from '../../common/enums/job-status.enum';
import { Role } from '../../common/enums/role.enum';
import { AuthUserPayload } from '../../common/interfaces/auth-user.interface';
import { CompanyService } from '../companies/companies.service';
import { Job, JobDocument } from '../jobs/schemas/jobs.schema';
import { MailService } from '../mail/mail.service';
import {
  CreateApplicationDto,
  QueryApplicationDto,
  UpdateApplicationStatusDto,
} from './dto/application.dto';
import { Application, ApplicationDocument } from './schemas/applications.schema';

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    @InjectModel(Application.name) private readonly model: Model<ApplicationDocument>,
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
    private readonly companyService: CompanyService,
    private readonly mailService: MailService,
  ) {}

  async apply(userId: string, dto: CreateApplicationDto) {
    const job = await this.jobModel.findById(dto.jobId).exec();
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');

    if (job.status !== JobStatus.Approved) {
      throw new BadRequestException('Tin tuyển dụng chưa được duyệt hoặc đã đóng');
    }
    if (job.deadline && new Date(job.deadline).getTime() < Date.now()) {
      throw new BadRequestException('Tin tuyển dụng đã hết hạn ứng tuyển');
    }

    const jobObjectId = new Types.ObjectId(dto.jobId);
    const userObjectId = new Types.ObjectId(userId);
    const duplicate = await this.model.findOne({ job: jobObjectId, user: userObjectId }).exec();
    if (duplicate) {
      throw new ConflictException('Bạn đã ứng tuyển công việc này rồi');
    }

    return this.model.create({
      job: jobObjectId,
      user: userObjectId,
      cvUrl: dto.cvUrl,
      coverLetter: dto.coverLetter,
      status: ApplicationStatus.Applied,
      appliedAt: new Date(),
    });
  }

  async findMyApplications(userId: string, query: QueryApplicationDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const filter: Record<string, unknown> = { user: new Types.ObjectId(userId) };
    if (query.status) filter.status = query.status;
    if (query.jobId) filter.job = new Types.ObjectId(query.jobId);

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .populate({
          path: 'job',
          select: 'title location salaryMin salaryMax workMode level status deadline company',
          populate: { path: 'company', select: 'name logo address' },
        })
        .sort({ appliedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  }

  async findForEmployer(userId: string, query: QueryApplicationDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const company = await this.companyService.findOptionalByUser(userId);
    if (!company) {
      return { items: [], total: 0, page, limit };
    }

    const companyJobs = await this.jobModel.find({ company: company._id }).select('_id').exec();
    const allowedJobIds = companyJobs.map((j) => String(j._id));
    if (allowedJobIds.length === 0) {
      return { items: [], total: 0, page, limit };
    }

    if (query.jobId && !allowedJobIds.includes(query.jobId)) {
      throw new ForbiddenException('Bạn không có quyền xem đơn ứng tuyển của tin này');
    }

    const targetJobIds = query.jobId
      ? [new Types.ObjectId(query.jobId)]
      : companyJobs.map((j) => j._id);

    const filter: Record<string, unknown> = { job: { $in: targetJobIds } };
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('job', 'title location status')
        .populate('user', 'fullName email phone avatar')
        .sort({ appliedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  }

  async findByJob(jobId: string, actor: AuthUserPayload, query: QueryApplicationDto) {
    const job = await this.jobModel.findById(jobId).populate('company', 'user').exec();
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');

    if (actor.role !== Role.Admin) {
      const ownerId = (job.company as unknown as { user?: Types.ObjectId })?.user;
      if (!ownerId || String(ownerId) !== actor.userId) {
        throw new ForbiddenException('Bạn không có quyền xem ứng viên của tin này');
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const filter: Record<string, unknown> = { job: new Types.ObjectId(jobId) };
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('user', 'fullName email phone avatar')
        .sort({ appliedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  }

  private async findAuthorizedDoc(id: string, actor: AuthUserPayload, allowCandidate: boolean) {
    const doc = await this.model
      .findById(id)
      .populate({
        path: 'job',
        select: 'title location status company',
        populate: { path: 'company', select: 'name logo user' },
      })
      .populate('user', 'fullName email phone avatar')
      .exec();
    if (!doc) throw new NotFoundException('Không tìm thấy đơn ứng tuyển');

    if (actor.role === Role.Admin) return doc;

    const candidateId = String((doc.user as unknown as { _id?: Types.ObjectId })?._id || doc.user);
    const companyUserId = (
      doc.job as unknown as { company?: { user?: Types.ObjectId } }
    )?.company?.user;

    const isCandidateOwner = allowCandidate && candidateId === actor.userId;
    const isEmployerOwner = !!companyUserId && String(companyUserId) === actor.userId;

    if (!isCandidateOwner && !isEmployerOwner) {
      throw new ForbiddenException('Bạn không có quyền thao tác với đơn ứng tuyển này');
    }

    return doc;
  }

  findOneAuthorized(id: string, actor: AuthUserPayload) {
    return this.findAuthorizedDoc(id, actor, true);
  }

  async updateStatus(id: string, actor: AuthUserPayload, dto: UpdateApplicationStatusDto) {
    const doc = await this.findAuthorizedDoc(id, actor, false);
    const updated = await this.model
      .findByIdAndUpdate(id, { status: dto.status }, { new: true })
      .populate('job', 'title')
      .populate('user', 'fullName email')
      .exec();

    if (dto.notifyByEmail) {
      const candidate = doc.user as unknown as { email?: string; fullName?: string };
      const job = doc.job as unknown as { title?: string; company?: { name?: string } };
      if (candidate?.email) {
        const companyName = job?.company?.name || 'Nhà tuyển dụng';
        const jobTitle = job?.title || 'Vị trí tuyển dụng';
        const noteHtml = dto.note ? `<p>Ghi chú từ nhà tuyển dụng: ${dto.note}</p>` : '';
        try {
          await this.mailService.send(
            candidate.email,
            `JobNet – Cập nhật trạng thái ứng tuyển: ${jobTitle}`,
            `<p>Xin chào <strong>${candidate.fullName || 'Ứng viên'}</strong>,</p>
             <p>Hồ sơ ứng tuyển của bạn cho vị trí <strong>${jobTitle}</strong> tại <strong>${companyName}</strong> đã được cập nhật sang trạng thái: <strong>${dto.status}</strong>.</p>
             ${noteHtml}`,
          );
        } catch (error) {
          this.logger.warn(`Failed to send application status email: ${(error as Error).message}`);
        }
      }
    }

    return updated;
  }

  async withdraw(id: string, actor: AuthUserPayload) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy đơn ứng tuyển');

    if (actor.role !== Role.Admin) {
      if (String(doc.user) !== actor.userId) {
        throw new ForbiddenException('Bạn không có quyền rút đơn ứng tuyển này');
      }
      if (doc.status !== ApplicationStatus.Applied) {
        throw new BadRequestException('Chỉ có thể rút đơn khi đang ở trạng thái mới ứng tuyển');
      }
    }

    await this.model.findByIdAndDelete(id).exec();
    return { deleted: true };
  }
}
