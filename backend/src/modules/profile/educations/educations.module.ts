import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Education, EducationSchema } from './schemas/educations.schema';
import { EducationService } from './educations.service';
import { EducationController } from './educations.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Education.name, schema: EducationSchema }])],
  controllers: [EducationController],
  providers: [EducationService],
  exports: [EducationService, MongooseModule],
})
export class EducationModule {}
