import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyModule } from '../companies/companies.module';
import { JobModule } from '../jobs/jobs.module';
import { MailModule } from '../mail/mail.module';
import { ApplicationController } from './applications.controller';
import { ApplicationService } from './applications.service';
import { Application, ApplicationSchema } from './schemas/applications.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Application.name, schema: ApplicationSchema }]),
    JobModule,
    CompanyModule,
    MailModule,
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService],
  exports: [ApplicationService, MongooseModule],
})
export class ApplicationModule {}
