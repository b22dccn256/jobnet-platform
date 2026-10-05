import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketInsight, MarketInsightSchema } from './schemas/market-insights.schema';
import { MarketInsightService } from './market-insights.service';
import { MarketInsightController } from './market-insights.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: MarketInsight.name, schema: MarketInsightSchema }])],
  controllers: [MarketInsightController],
  providers: [MarketInsightService],
  exports: [MarketInsightService, MongooseModule],
})
export class MarketInsightModule {}
