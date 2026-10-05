import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PremiumPackageDocument = HydratedDocument<PremiumPackage>;

@Schema({ timestamps: true, collection: 'premium_packages' })
export class PremiumPackage {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  durationDays: number;

  @Prop()
  postLimit: number;

  @Prop({ type: [String], default: [] })
  features: string[];
}

export const PremiumPackageSchema = SchemaFactory.createForClass(PremiumPackage);
