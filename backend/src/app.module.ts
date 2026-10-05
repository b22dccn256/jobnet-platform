import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { CompanyModule } from './modules/companies/companies.module';
import { CategoryModule } from './modules/categories/categories.module';
import { JobModule } from './modules/jobs/jobs.module';
import { ApplicationModule } from './modules/applications/applications.module';
import { JobLikeModule } from './modules/job-likes/job-likes.module';
import { CompanyFollowModule } from './modules/company-follows/company-follows.module';
import { PremiumPackageModule } from './modules/premium-packages/premium-packages.module';
import { RecruiterPremiumModule } from './modules/recruiter-premium/recruiter-premium.module';
import { ScrapedJobModule } from './modules/scraped-jobs/scraped-jobs.module';
import { MarketInsightModule } from './modules/market-insights/market-insights.module';
import { EducationModule } from './modules/profile/educations/educations.module';
import { CourseModule } from './modules/profile/courses/courses.module';
import { HealthModule } from './modules/profile/health/health.module';
import { LanguageModule } from './modules/profile/languages/languages.module';
import { OtherInfoModule } from './modules/profile/other-info/other-info.module';
import { ProjectModule } from './modules/profile/projects/projects.module';
import { WorkExperienceModule } from './modules/profile/work-experiences/work-experiences.module';
import { UserModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { SearchModule } from './modules/search/search.module';
import { StorageModule } from './modules/storage/storage.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { PaymentModule } from './modules/payments/payments.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { MailModule } from './modules/mail/mail.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({ uri: cfg.get<string>('MONGO_URI') }),
    }),
    ScheduleModule.forRoot(),
    CompanyModule,
    CategoryModule,
    JobModule,
    ApplicationModule,
    JobLikeModule,
    CompanyFollowModule,
    PremiumPackageModule,
    RecruiterPremiumModule,
    ScrapedJobModule,
    MarketInsightModule,
    EducationModule,
    CourseModule,
    HealthModule,
    LanguageModule,
    OtherInfoModule,
    ProjectModule,
    WorkExperienceModule,
    UserModule,
    AuthModule,
    SearchModule,
    StorageModule,
    ChatbotModule,
    PaymentModule,
    RecommendationModule,
    MailModule,
    AdminModule,
    NotificationsModule,
  ],
})
export class AppModule {}
