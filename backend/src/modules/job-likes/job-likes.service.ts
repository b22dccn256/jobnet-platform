import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobStatus } from '../../common/enums/job-status.enum';
import { Job, JobDocument } from '../jobs/schemas/jobs.schema';
import { JobLike, JobLikeDocument } from './schemas/job-likes.schema';

@Injectable()
export class JobLikeService {
  constructor(
    @InjectModel(JobLike.name) private readonly model: Model<JobLikeDocument>,
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
  ) {}

  async like(userId: string, jobId: string) {
    const job = await this.jobModel.findById(jobId).exec();
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    if (job.status !== JobStatus.Approved) {
      throw new BadRequestException('Chỉ có thể lưu tin tuyển dụng đã được duyệt');
    }

    const userObjectId = new Types.ObjectId(userId);
    const jobObjectId = new Types.ObjectId(jobId);
    const item = await this.model
      .findOneAndUpdate(
        { user: userObjectId, job: jobObjectId },
        { $setOnInsert: { user: userObjectId, job: jobObjectId } },
        { upsert: true, new: true },
      )
      .exec();

    return { liked: true, item };
  }

  async unlike(userId: string, jobId: string) {
    const deleted = await this.model
      .findOneAndDelete({
        user: new Types.ObjectId(userId),
        job: new Types.ObjectId(jobId),
      })
      .exec();

    return { liked: false, deleted: Boolean(deleted) };
  }

  async isLiked(userId: string, jobId: string) {
    const found = await this.model.exists({
      user: new Types.ObjectId(userId),
      job: new Types.ObjectId(jobId),
    });
    return { liked: Boolean(found) };
  }

  async findMine(userId: string, page = 1, limit = 10) {
    const filter = { user: new Types.ObjectId(userId) };
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .populate({
          path: 'job',
          select: 'title location salaryMin salaryMax workMode level status deadline company',
          populate: { path: 'company', select: 'name logo address' },
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }
}
