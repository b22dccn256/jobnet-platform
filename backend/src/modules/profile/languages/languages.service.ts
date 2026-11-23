import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseUserOwnedService } from '../../../common/services/base-user-owned.service';
import { Language, LanguageDocument } from './schemas/languages.schema';

@Injectable()
export class LanguageService extends BaseUserOwnedService<LanguageDocument> {
  constructor(@InjectModel(Language.name) model: Model<LanguageDocument>) {
    super(model, 'ngoại ngữ');
  }
}
