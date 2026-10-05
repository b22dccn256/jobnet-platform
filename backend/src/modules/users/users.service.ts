import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/users.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly model: Model<UserDocument>) {}

  create(data: Partial<User>) {
    return this.model.create(data);
  }

  findByEmail(email: string, withPassword = false) {
    const q = this.model.findOne({ email: email.toLowerCase() });
    return withPassword ? q.select('+password').exec() : q.exec();
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('User not found');
    return doc;
  }

  async findAll(page = 1, limit = 10) {
    const [items, total] = await Promise.all([
      this.model.find().skip((page - 1) * limit).limit(limit).exec(),
      this.model.countDocuments(),
    ]);
    return { items, total, page, limit };
  }

  update(id: string, data: Partial<User>) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }
}
