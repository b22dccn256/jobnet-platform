import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema, HydratedDocument } from 'mongoose';

export type MarketInsightDocument = HydratedDocument<MarketInsight>;

@Schema({ timestamps: true, collection: 'market_insights' })
export class MarketInsight {
  @Prop({ required: true, enum: ['salary_by_category', 'hot_skills', 'demand_trend'] })
  type: string;

  @Prop()
  period: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  data: any;

  @Prop({ default: Date.now })
  generatedAt: Date;
}

export const MarketInsightSchema = SchemaFactory.createForClass(MarketInsight);
