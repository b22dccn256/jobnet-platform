import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { escapeRegex, slugify } from '../../common/utils/string.util';
import { CreateCategoryDto, QueryCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Category, CategoryDocument } from './schemas/categories.schema';

@Injectable()
export class CategoryService {
  constructor(@InjectModel(Category.name) private readonly model: Model<CategoryDocument>) {}

  async create(dto: CreateCategoryDto) {
    const name = dto.name.trim();
    const slug = slugify(dto.slug || name);
    if (!slug) {
      throw new BadRequestException('Slug danh mục không hợp lệ');
    }

    const duplicate = await this.model.findOne({ $or: [{ name }, { slug }] }).exec();
    if (duplicate) {
      throw new ConflictException('Tên hoặc slug danh mục đã tồn tại');
    }

    return this.model.create({
      name,
      slug,
      description: dto.description?.trim(),
    });
  }

  async findAll(query: QueryCategoryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const filter: Record<string, unknown> = {};

    if (query.q?.trim()) {
      const regex = new RegExp(escapeRegex(query.q.trim()), 'i');
      filter.$or = [{ name: regex }, { slug: regex }];
    }

    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy danh mục');
    return doc;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.findOne(id);
    const name = dto.name ? dto.name.trim() : existing.name;
    const slug = dto.slug ? slugify(dto.slug) : dto.name ? slugify(name) : existing.slug;
    if (!slug) {
      throw new BadRequestException('Slug danh mục không hợp lệ');
    }

    const duplicate = await this.model
      .findOne({
        _id: { $ne: id },
        $or: [{ name }, { slug }],
      })
      .exec();
    if (duplicate) {
      throw new ConflictException('Tên hoặc slug danh mục đã tồn tại');
    }

    return this.model
      .findByIdAndUpdate(
        id,
        {
          name,
          slug,
          ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
        },
        { new: true },
      )
      .exec();
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy danh mục');
    return { deleted: true };
  }
}
