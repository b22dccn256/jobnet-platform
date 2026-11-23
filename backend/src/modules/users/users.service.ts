import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/users.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly model: Model<UserDocument>) {}

  create(data: Partial<User>) {
    return this.model.create({
      ...data,
      email: data.email?.trim().toLowerCase(),
    });
  }

  findByEmail(email: string, withPassword = false) {
    const q = this.model.findOne({ email: email.trim().toLowerCase() });
    return withPassword ? q.select('+password').exec() : q.exec();
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('User not found');
    return doc;
  }

  async findAll(page = 1, limit = 10) {
    const [items, total] = await Promise.all([
      this.model.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.model.countDocuments(),
    ]);
    return { items, total, page, limit };
  }

  findByIdWithPassword(id: string) {
    return this.model.findById(id).select('+password').exec();
  }

  findByResetToken(token: string) {
    return this.model
      .findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      })
      .select('+resetPasswordToken +resetPasswordExpires')
      .exec();
  }

  setResetToken(id: string, token: string, expires: Date) {
    return this.model.findByIdAndUpdate(
      id,
      { resetPasswordToken: token, resetPasswordExpires: expires },
      { new: true },
    ).exec();
  }

  updatePassword(id: string, password: string) {
    return this.model.findByIdAndUpdate(
      id,
      {
        password,
        $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
      },
      { new: true },
    ).exec();
  }

  async update(id: string, data: Partial<User>) {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    ) as Partial<User>;
    if (Array.isArray(cleanData.skills)) {
      cleanData.skills = Array.from(
        new Set(cleanData.skills.map((s) => s.trim()).filter(Boolean)),
      );
    }
    const doc = await this.model.findByIdAndUpdate(id, cleanData, { new: true }).exec();
    if (!doc) throw new NotFoundException('User not found');
    return doc;
  }
}
