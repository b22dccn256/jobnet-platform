import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseUserOwnedService } from '../../../common/services/base-user-owned.service';
import { Course, CourseDocument } from './schemas/courses.schema';

@Injectable()
export class CourseService extends BaseUserOwnedService<CourseDocument> {
  constructor(@InjectModel(Course.name) model: Model<CourseDocument>) {
    super(model, 'khóa học', { date: -1, createdAt: -1 });
  }
}
