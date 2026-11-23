import { Module } from '@nestjs/common';
import { UserModule } from '../../users/users.module';
import { CourseModule } from '../courses/courses.module';
import { EducationModule } from '../educations/educations.module';
import { HealthModule } from '../health/health.module';
import { LanguageModule } from '../languages/languages.module';
import { OtherInfoModule } from '../other-info/other-info.module';
import { ProjectModule } from '../projects/projects.module';
import { WorkExperienceModule } from '../work-experiences/work-experiences.module';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';

@Module({
  imports: [
    UserModule,
    EducationModule,
    CourseModule,
    HealthModule,
    LanguageModule,
    OtherInfoModule,
    ProjectModule,
    WorkExperienceModule,
  ],
  controllers: [CvController],
  providers: [CvService],
  exports: [CvService],
})
export class CvModule {}
