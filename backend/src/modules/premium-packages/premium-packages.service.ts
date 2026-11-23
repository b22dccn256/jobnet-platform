import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePremiumPackageDto, UpdatePremiumPackageDto } from './dto/premium-package.dto';
import { PremiumPackage, PremiumPackageDocument } from './schemas/premium-packages.schema';

@Injectable()
export class PremiumPackageService {
  constructor(
    @InjectModel(PremiumPackage.name) private readonly model: Model<PremiumPackageDocument>,
  ) {}

  create(dto: CreatePremiumPackageDto) {
    return this.model.create({
      ...dto,
      name: dto.name.trim(),
      features: dto.features?.map((f) => f.trim()).filter(Boolean) || [],
    });
  }

  async findAll(page = 1, limit = 10) {
    const [items, total] = await Promise.all([
      this.model.find().sort({ price: 1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.model.countDocuments(),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy gói dịch vụ');
    return doc;
  }

  async update(id: string, dto: UpdatePremiumPackageDto) {
    const cleanData = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    ) as Partial<PremiumPackage>;
    if (cleanData.name) cleanData.name = cleanData.name.trim();
    if (cleanData.features) {
      cleanData.features = cleanData.features.map((f) => f.trim()).filter(Boolean);
    }

    const doc = await this.model.findByIdAndUpdate(id, cleanData, { new: true }).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy gói dịch vụ');
    return doc;
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy gói dịch vụ');
    return { deleted: true };
  }
}
