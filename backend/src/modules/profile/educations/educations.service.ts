import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseUserOwnedService } from '../../../common/services/base-user-owned.service';
import { Education, EducationDocument } from './schemas/educations.schema';

@Injectable()
export class EducationService extends BaseUserOwnedService<EducationDocument> {
  constructor(@InjectModel(Education.name) model: Model<EducationDocument>) {
    super(model, 'thông tin học vấn', { startDate: -1, createdAt: -1 });
  }
}
