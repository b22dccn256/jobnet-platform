import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Application, ApplicationSchema } from './schemas/applications.schema';
import { ApplicationService } from './applications.service';
import { ApplicationController } from './applications.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Application.name, schema: ApplicationSchema }])],
  controllers: [ApplicationController],
  providers: [ApplicationService],
  exports: [ApplicationService, MongooseModule],
})
export class ApplicationModule {}
