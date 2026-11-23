import { Module } from '@nestjs/common';
import { ApplicationModule } from '../applications/applications.module';
import { CompanyModule } from '../companies/companies.module';
import { JobModule } from '../jobs/jobs.module';
import { PremiumPackageModule } from '../premium-packages/premium-packages.module';
import { RecruiterPremiumModule } from '../recruiter-premium/recruiter-premium.module';
import { SearchModule } from '../search/search.module';
import { UserModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    UserModule,
    JobModule,
    CompanyModule,
    ApplicationModule,
    RecruiterPremiumModule,
    PremiumPackageModule,
    SearchModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
