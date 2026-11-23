import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryModule } from '../categories/categories.module';
import { CompanyModule } from '../companies/companies.module';
import { SearchModule } from '../search/search.module';
import { JobController } from './jobs.controller';
import { JobService } from './jobs.service';
import { Job, JobSchema } from './schemas/jobs.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]),
    CompanyModule,
    CategoryModule,
    SearchModule,
  ],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService, MongooseModule],
})
export class JobModule {}
