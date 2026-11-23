import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobStatus } from '../../common/enums/job-status.enum';
import { Job, JobDocument } from '../jobs/schemas/jobs.schema';
import { ScrapedJob, ScrapedJobDocument } from '../scraped-jobs/schemas/scraped-jobs.schema';
import {
  CreateMarketInsightDto,
  QueryMarketInsightDto,
  UpdateMarketInsightDto,
} from './dto/market-insight.dto';
import { MarketInsight, MarketInsightDocument } from './schemas/market-insights.schema';

@Injectable()
export class MarketInsightService {
  constructor(
    @InjectModel(MarketInsight.name) private readonly model: Model<MarketInsightDocument>,
    @InjectModel(ScrapedJob.name) private readonly scrapedJobModel: Model<ScrapedJobDocument>,
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
  ) {}

  create(dto: CreateMarketInsightDto) {
    return this.model.create({ ...dto, generatedAt: new Date() });
  }

  async findAll(query: QueryMarketInsightDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const filter: Record<string, unknown> = {};
    if (query.type) filter.type = query.type;
    if (query.period?.trim()) filter.period = query.period.trim();

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ generatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async computeLiveInsights() {
    const scrapedCount = await this.scrapedJobModel.countDocuments();
    if (scrapedCount > 0) {
      const [salary, skills, demand] = await Promise.all([
        this.scrapedJobModel.aggregate([
          { $match: { salaryMin: { $ne: null }, salaryMax: { $ne: null } } },
          {
            $group: {
              _id: { $ifNull: ['$category', 'Khác'] },
              avgMin: { $avg: '$salaryMin' },
              avgMax: { $avg: '$salaryMax' },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ]),
        this.scrapedJobModel.aggregate([
          { $unwind: '$skills' },
          { $group: { _id: '$skills', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ]),
        this.scrapedJobModel.aggregate([
          { $match: { postedAt: { $ne: null } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$postedAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);
      return { source: 'scraped_jobs', salary, skills, demand };
    }

    // Fallback: tổng hợp từ tin đã duyệt nội bộ nếu chưa chạy Crawler
    const [salary, skills, demand] = await Promise.all([
      this.jobModel.aggregate([
        { $match: { status: JobStatus.Approved, salaryMin: { $ne: null }, salaryMax: { $ne: null } } },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'catInfo',
          },
        },
        { $unwind: { path: '$catInfo', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ['$catInfo.name', 'Khác'] },
            avgMin: { $avg: '$salaryMin' },
            avgMax: { $avg: '$salaryMax' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      this.jobModel.aggregate([
        { $match: { status: JobStatus.Approved } },
        { $unwind: '$skills' },
        { $group: { _id: '$skills', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      this.jobModel.aggregate([
        { $match: { status: JobStatus.Approved, createdAt: { $ne: null } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return { source: 'jobs', salary, skills, demand };
  }

  async recalculate() {
    const now = new Date();
    const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const computed = await this.computeLiveInsights();

    const pairs: Array<[string, unknown[]]> = [
      ['salary_by_category', computed.salary],
      ['hot_skills', computed.skills],
      ['demand_trend', computed.demand],
    ];

    for (const [type, data] of pairs) {
      await this.model.findOneAndUpdate(
        { type, period },
        { $set: { data, generatedAt: now } },
        { upsert: true, new: true },
      );
    }

    return {
      period,
      source: computed.source,
      salaryByCategory: computed.salary,
      hotSkills: computed.skills,
      demandTrend: computed.demand,
    };
  }

  async getOverview() {
    const [salaryDoc, skillsDoc, demandDoc] = await Promise.all([
      this.model.findOne({ type: 'salary_by_category' }).sort({ generatedAt: -1 }).lean().exec(),
      this.model.findOne({ type: 'hot_skills' }).sort({ generatedAt: -1 }).lean().exec(),
      this.model.findOne({ type: 'demand_trend' }).sort({ generatedAt: -1 }).lean().exec(),
    ]);

    if (salaryDoc && skillsDoc && demandDoc) {
      return {
        source: 'market_insights',
        period: salaryDoc.period,
        salaryByCategory: salaryDoc.data || [],
        hotSkills: skillsDoc.data || [],
        demandTrend: demandDoc.data || [],
      };
    }

    const live = await this.computeLiveInsights();
    return {
      source: live.source,
      period: new Date().toISOString().slice(0, 7),
      salaryByCategory: salaryDoc?.data || live.salary,
      hotSkills: skillsDoc?.data || live.skills,
      demandTrend: demandDoc?.data || live.demand,
    };
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy dữ liệu thống kê thị trường');
    return doc;
  }

  async update(id: string, dto: UpdateMarketInsightDto) {
    const cleanData = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    const doc = await this.model.findByIdAndUpdate(id, cleanData, { new: true }).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy dữ liệu thống kê thị trường');
    return doc;
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy dữ liệu thống kê thị trường');
    return { deleted: true };
  }
}
