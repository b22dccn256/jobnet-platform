import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Language, LanguageSchema } from './schemas/languages.schema';
import { LanguageService } from './languages.service';
import { LanguageController } from './languages.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Language.name, schema: LanguageSchema }])],
  controllers: [LanguageController],
  providers: [LanguageService],
  exports: [LanguageService, MongooseModule],
})
export class LanguageModule {}
