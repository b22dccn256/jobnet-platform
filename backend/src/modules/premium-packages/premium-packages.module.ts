import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PremiumPackage, PremiumPackageSchema } from './schemas/premium-packages.schema';
import { PremiumPackageService } from './premium-packages.service';
import { PremiumPackageController } from './premium-packages.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: PremiumPackage.name, schema: PremiumPackageSchema }])],
  controllers: [PremiumPackageController],
  providers: [PremiumPackageService],
  exports: [PremiumPackageService, MongooseModule],
})
export class PremiumPackageModule {}
