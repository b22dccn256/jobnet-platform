import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type RecruiterPremiumDocument = HydratedDocument<RecruiterPremium>;

@Schema({ timestamps: true, collection: 'recruiter_premium' })
export class RecruiterPremium {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PremiumPackage', required: true })
  package: Types.ObjectId;

  @Prop()
  startAt: Date;

  @Prop()
  endAt: Date;

  @Prop()
  remainingPosts: number;

  @Prop()
  paymentRef: string;

  @Prop({ enum: ['pending', 'success', 'failed'], default: 'pending' })
  paymentStatus: string;
}

export const RecruiterPremiumSchema = SchemaFactory.createForClass(RecruiterPremium);
