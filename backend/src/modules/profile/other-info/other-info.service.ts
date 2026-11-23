import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseUserOwnedService } from '../../../common/services/base-user-owned.service';
import { OtherInfo, OtherInfoDocument } from './schemas/other-info.schema';

@Injectable()
export class OtherInfoService extends BaseUserOwnedService<OtherInfoDocument> {
  constructor(@InjectModel(OtherInfo.name) model: Model<OtherInfoDocument>) {
    super(model, 'thông tin khác');
  }
}
