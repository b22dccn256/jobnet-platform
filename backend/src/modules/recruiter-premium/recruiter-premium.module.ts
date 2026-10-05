import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecruiterPremium, RecruiterPremiumSchema } from './schemas/recruiter-premium.schema';
import { RecruiterPremiumService } from './recruiter-premium.service';
import { RecruiterPremiumController } from './recruiter-premium.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: RecruiterPremium.name, schema: RecruiterPremiumSchema }])],
  controllers: [RecruiterPremiumController],
  providers: [RecruiterPremiumService],
  exports: [RecruiterPremiumService, MongooseModule],
})
export class RecruiterPremiumModule {}
