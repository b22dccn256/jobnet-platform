import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ScrapedJob, ScrapedJobDocument } from './schemas/scraped-jobs.schema';

@Injectable()
export class ScrapedJobService {
  constructor(@InjectModel(ScrapedJob.name) private readonly model: Model<ScrapedJobDocument>) {}

  create(data: Partial<ScrapedJob>) {
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
    if (!doc) throw new NotFoundException('ScrapedJob not found');
    return doc;
  }

  async update(id: string, data: Partial<ScrapedJob>) {
    const doc = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!doc) throw new NotFoundException('ScrapedJob not found');
    return doc;
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException('ScrapedJob not found');
    return { deleted: true };
  }
}
