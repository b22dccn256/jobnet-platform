import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { escapeRegex } from '../../common/utils/string.util';
import {
  CreateScrapedJobDto,
  QueryScrapedJobDto,
  UpdateScrapedJobDto,
} from './dto/scraped-job.dto';
import { ScrapedJob, ScrapedJobDocument } from './schemas/scraped-jobs.schema';

@Injectable()
export class ScrapedJobService {
  constructor(
    @InjectModel(ScrapedJob.name) private readonly model: Model<ScrapedJobDocument>,
  ) {}

  async create(dto: CreateScrapedJobDto) {
    const existing = await this.model.findOne({ sourceUrl: dto.sourceUrl.trim() }).exec();
    if (existing) {
      throw new ConflictException('URL tin cào này đã tồn tại trong hệ thống');
    }
    return this.model.create({
      ...dto,
      sourceUrl: dto.sourceUrl.trim(),
      postedAt: dto.postedAt ? new Date(dto.postedAt) : undefined,
      scrapedAt: new Date(),
    });
  }

  async findAll(query: QueryScrapedJobDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const filter: Record<string, unknown> = {};

    if (query.q?.trim()) {
      const regex = new RegExp(escapeRegex(query.q.trim()), 'i');
      filter.$or = [{ title: regex }, { company: regex }, { skills: regex }];
    }
    if (query.source?.trim()) {
      filter.source = new RegExp(escapeRegex(query.source.trim()), 'i');
    }
    if (query.category?.trim()) {
      filter.category = new RegExp(escapeRegex(query.category.trim()), 'i');
    }
    if (query.location?.trim()) {
      filter.location = new RegExp(escapeRegex(query.location.trim()), 'i');
    }

    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ scrapedAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy dữ liệu việc làm cào');
    return doc;
  }

  async update(id: string, dto: UpdateScrapedJobDto) {
    const cleanData = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    const doc = await this.model.findByIdAndUpdate(id, cleanData, { new: true }).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy dữ liệu việc làm cào');
    return doc;
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy dữ liệu việc làm cào');
    return { deleted: true };
  }
}
