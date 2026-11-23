import { Module } from '@nestjs/common';
import { CompanyModule } from '../companies/companies.module';
import { PremiumPackageModule } from '../premium-packages/premium-packages.module';
import { RecruiterPremiumModule } from '../recruiter-premium/recruiter-premium.module';
import { PaymentController } from './payments.controller';
import { PaymentService } from './payments.service';

@Module({
  imports: [CompanyModule, PremiumPackageModule, RecruiterPremiumModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
