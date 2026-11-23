import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobModule } from '../jobs/jobs.module';
import { ScrapedJobModule } from '../scraped-jobs/scraped-jobs.module';
import { MarketInsightController } from './market-insights.controller';
import { MarketInsightService } from './market-insights.service';
import { MarketInsight, MarketInsightSchema } from './schemas/market-insights.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MarketInsight.name, schema: MarketInsightSchema }]),
    ScrapedJobModule,
    JobModule,
  ],
  controllers: [MarketInsightController],
  providers: [MarketInsightService],
  exports: [MarketInsightService, MongooseModule],
})
export class MarketInsightModule {}
