import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkExperience, WorkExperienceSchema } from './schemas/work-experiences.schema';
import { WorkExperienceService } from './work-experiences.service';
import { WorkExperienceController } from './work-experiences.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: WorkExperience.name, schema: WorkExperienceSchema }])],
  controllers: [WorkExperienceController],
  providers: [WorkExperienceService],
  exports: [WorkExperienceService, MongooseModule],
})
export class WorkExperienceModule {}
