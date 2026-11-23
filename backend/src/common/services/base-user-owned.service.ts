import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { HydratedDocument, Model, SortOrder, Types, UpdateQuery } from 'mongoose';

export interface UserOwnedEntity {
  user: Types.ObjectId;
}

/** Reusable CRUD service scoped to the authenticated owner (`user`). */
export abstract class BaseUserOwnedService<
  TDoc extends HydratedDocument<UserOwnedEntity>,
> {
  protected constructor(
    protected readonly model: Model<TDoc>,
    private readonly entityLabel: string,
    private readonly defaultSort: Record<string, SortOrder> = { createdAt: -1 },
  ) {}

  createForUser(userId: string, data: Record<string, unknown>): Promise<TDoc> {
    return this.model.create({
      ...data,
      user: new Types.ObjectId(userId),
    } as never) as unknown as Promise<TDoc>;
  }

  async findAllByUser(userId: string, page = 1, limit = 20) {
    const filter = { user: new Types.ObjectId(userId) };
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(this.defaultSort)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async findOneForUser(id: string, userId: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`Không tìm thấy ${this.entityLabel}`);
    }
    if (String(doc.user) !== userId) {
      throw new ForbiddenException(`Bạn không có quyền truy cập ${this.entityLabel} này`);
    }
    return doc;
  }

  async updateForUser(id: string, userId: string, data: Record<string, unknown>) {
    await this.findOneForUser(id, userId);
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );
    return this.model.findByIdAndUpdate(id, cleanData as UpdateQuery<TDoc>, { new: true }).exec();
  }

  async removeForUser(id: string, userId: string) {
    await this.findOneForUser(id, userId);
    await this.model.findByIdAndDelete(id).exec();
    return { deleted: true };
  }
}
