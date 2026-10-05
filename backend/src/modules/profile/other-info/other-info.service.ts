import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OtherInfo, OtherInfoDocument } from './schemas/other-info.schema';

@Injectable()
export class OtherInfoService {
  constructor(@InjectModel(OtherInfo.name) private readonly model: Model<OtherInfoDocument>) {}

  create(data: Partial<OtherInfo>) {
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
    if (!doc) throw new NotFoundException('OtherInfo not found');
    return doc;
  }

  async update(id: string, data: Partial<OtherInfo>) {
    const doc = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!doc) throw new NotFoundException('OtherInfo not found');
    return doc;
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException('OtherInfo not found');
    return { deleted: true };
  }
}
