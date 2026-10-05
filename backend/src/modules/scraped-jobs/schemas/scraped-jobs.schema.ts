import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ScrapedJobDocument = HydratedDocument<ScrapedJob>;

@Schema({ timestamps: true, collection: 'scraped_jobs' })
export class ScrapedJob {
  @Prop()
  source: string;

  @Prop({ required: true, unique: true })
  sourceUrl: string;

  @Prop()
  title: string;

  @Prop()
  company: string;

  @Prop()
  location: string;

  @Prop()
  salaryMin: number;

  @Prop()
  salaryMax: number;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop()
  category: string;

  @Prop()
  postedAt: Date;

  @Prop({ default: Date.now })
  scrapedAt: Date;
}

export const ScrapedJobSchema = SchemaFactory.createForClass(ScrapedJob);
