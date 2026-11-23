import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseUserOwnedService } from '../../../common/services/base-user-owned.service';
import { Project, ProjectDocument } from './schemas/projects.schema';

@Injectable()
export class ProjectService extends BaseUserOwnedService<ProjectDocument> {
  constructor(@InjectModel(Project.name) model: Model<ProjectDocument>) {
    super(model, 'dự án');
  }
}
