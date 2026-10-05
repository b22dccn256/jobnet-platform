import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyFollow, CompanyFollowSchema } from './schemas/company-follows.schema';
import { CompanyFollowService } from './company-follows.service';
import { CompanyFollowController } from './company-follows.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: CompanyFollow.name, schema: CompanyFollowSchema }])],
  controllers: [CompanyFollowController],
  providers: [CompanyFollowService],
  exports: [CompanyFollowService, MongooseModule],
})
export class CompanyFollowModule {}
