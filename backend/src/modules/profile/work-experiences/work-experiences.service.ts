import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseUserOwnedService } from '../../../common/services/base-user-owned.service';
import { WorkExperience, WorkExperienceDocument } from './schemas/work-experiences.schema';

@Injectable()
export class WorkExperienceService extends BaseUserOwnedService<WorkExperienceDocument> {
  constructor(@InjectModel(WorkExperience.name) model: Model<WorkExperienceDocument>) {
    super(model, 'kinh nghiệm làm việc', { startDate: -1, createdAt: -1 });
  }
}
