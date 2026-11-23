import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyModule } from '../companies/companies.module';
import { PremiumPackageModule } from '../premium-packages/premium-packages.module';
import { RecruiterPremiumController } from './recruiter-premium.controller';
import { RecruiterPremiumService } from './recruiter-premium.service';
import { RecruiterPremium, RecruiterPremiumSchema } from './schemas/recruiter-premium.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RecruiterPremium.name, schema: RecruiterPremiumSchema }]),
    CompanyModule,
    PremiumPackageModule,
  ],
  controllers: [RecruiterPremiumController],
  providers: [RecruiterPremiumService],
  exports: [RecruiterPremiumService, MongooseModule],
})
export class RecruiterPremiumModule {}
