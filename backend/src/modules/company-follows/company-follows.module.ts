import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyModule } from '../companies/companies.module';
import { CompanyFollowController } from './company-follows.controller';
import { CompanyFollowService } from './company-follows.service';
import { CompanyFollow, CompanyFollowSchema } from './schemas/company-follows.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CompanyFollow.name, schema: CompanyFollowSchema }]),
    CompanyModule,
  ],
  controllers: [CompanyFollowController],
  providers: [CompanyFollowService],
  exports: [CompanyFollowService, MongooseModule],
})
export class CompanyFollowModule {}
