import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScrapedJob, ScrapedJobSchema } from './schemas/scraped-jobs.schema';
import { ScrapedJobService } from './scraped-jobs.service';
import { ScrapedJobController } from './scraped-jobs.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: ScrapedJob.name, schema: ScrapedJobSchema }])],
  controllers: [ScrapedJobController],
  providers: [ScrapedJobService],
  exports: [ScrapedJobService, MongooseModule],
})
export class ScrapedJobModule {}
