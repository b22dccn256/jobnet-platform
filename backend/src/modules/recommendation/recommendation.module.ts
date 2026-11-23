import { Module } from '@nestjs/common';
import { CompanyModule } from '../companies/companies.module';
import { JobModule } from '../jobs/jobs.module';
import { CourseModule } from '../profile/courses/courses.module';
import { EducationModule } from '../profile/educations/educations.module';
import { LanguageModule } from '../profile/languages/languages.module';
import { ProjectModule } from '../profile/projects/projects.module';
import { WorkExperienceModule } from '../profile/work-experiences/work-experiences.module';
import { RecruiterPremiumModule } from '../recruiter-premium/recruiter-premium.module';
import { UserModule } from '../users/users.module';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';

@Module({
  imports: [
    JobModule,
    UserModule,
    CompanyModule,
    RecruiterPremiumModule,
    EducationModule,
    WorkExperienceModule,
    ProjectModule,
    CourseModule,
    LanguageModule,
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
