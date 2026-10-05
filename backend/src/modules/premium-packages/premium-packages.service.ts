import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PremiumPackage, PremiumPackageDocument } from './schemas/premium-packages.schema';

@Injectable()
export class PremiumPackageService {
  constructor(@InjectModel(PremiumPackage.name) private readonly model: Model<PremiumPackageDocument>) {}

  create(data: Partial<PremiumPackage>) {
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
    if (!doc) throw new NotFoundException('PremiumPackage not found');
    return doc;
  }

  async update(id: string, data: Partial<PremiumPackage>) {
    const doc = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!doc) throw new NotFoundException('PremiumPackage not found');
    return doc;
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException('PremiumPackage not found');
    return { deleted: true };
  }
}
