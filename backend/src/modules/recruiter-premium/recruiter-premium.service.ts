import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecruiterPremium, RecruiterPremiumDocument } from './schemas/recruiter-premium.schema';

@Injectable()
export class RecruiterPremiumService {
  constructor(@InjectModel(RecruiterPremium.name) private readonly model: Model<RecruiterPremiumDocument>) {}

  create(data: Partial<RecruiterPremium>) {
    return this.model.create(data);
  }

  async findAll(page = 1, limit = 10) {
    const [items, total] = await Promise.all([
      this.model.find().skip((page - 1) * limit).limit(limit).exec(),
      this.model.countDocuments(),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('RecruiterPremium not found');
    return doc;
  }

  async update(id: string, data: Partial<RecruiterPremium>) {
    const doc = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!doc) throw new NotFoundException('RecruiterPremium not found');
    return doc;
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException('RecruiterPremium not found');
    return { deleted: true };
  }
}
