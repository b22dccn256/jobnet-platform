import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtherInfo, OtherInfoSchema } from './schemas/other-info.schema';
import { OtherInfoService } from './other-info.service';
import { OtherInfoController } from './other-info.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: OtherInfo.name, schema: OtherInfoSchema }])],
  controllers: [OtherInfoController],
  providers: [OtherInfoService],
  exports: [OtherInfoService, MongooseModule],
})
export class OtherInfoModule {}
