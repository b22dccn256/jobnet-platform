import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseUserOwnedService } from '../../../common/services/base-user-owned.service';
import { Health, HealthDocument } from './schemas/health.schema';

@Injectable()
export class HealthService extends BaseUserOwnedService<HealthDocument> {
  constructor(@InjectModel(Health.name) model: Model<HealthDocument>) {
    super(model, 'thông tin sức khỏe');
  }
}
