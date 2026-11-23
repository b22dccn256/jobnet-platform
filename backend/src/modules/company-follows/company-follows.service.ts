import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company, CompanyDocument } from '../companies/schemas/companies.schema';
import { CompanyFollow, CompanyFollowDocument } from './schemas/company-follows.schema';

@Injectable()
export class CompanyFollowService {
  constructor(
    @InjectModel(CompanyFollow.name) private readonly model: Model<CompanyFollowDocument>,
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
  ) {}

  async follow(userId: string, companyId: string) {
    const company = await this.companyModel.findById(companyId).exec();
    if (!company) throw new NotFoundException('Không tìm thấy công ty');

    const userObjectId = new Types.ObjectId(userId);
    const companyObjectId = new Types.ObjectId(companyId);
    const item = await this.model
      .findOneAndUpdate(
        { user: userObjectId, company: companyObjectId },
        { $setOnInsert: { user: userObjectId, company: companyObjectId } },
        { upsert: true, new: true },
      )
      .exec();

    return { following: true, item };
  }

  async unfollow(userId: string, companyId: string) {
    const deleted = await this.model
      .findOneAndDelete({
        user: new Types.ObjectId(userId),
        company: new Types.ObjectId(companyId),
      })
      .exec();

    return { following: false, deleted: Boolean(deleted) };
  }

  async isFollowing(userId: string, companyId: string) {
    const found = await this.model.exists({
      user: new Types.ObjectId(userId),
      company: new Types.ObjectId(companyId),
    });
    return { following: Boolean(found) };
  }

  async countFollowers(companyId: string) {
    const followersCount = await this.model.countDocuments({
      company: new Types.ObjectId(companyId),
    });
    return { companyId, followersCount };
  }

  async findMine(userId: string, page = 1, limit = 10) {
    const filter = { user: new Types.ObjectId(userId) };
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('company', 'name logo address industry size website')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }
}
