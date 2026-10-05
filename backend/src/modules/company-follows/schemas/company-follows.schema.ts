import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type CompanyFollowDocument = HydratedDocument<CompanyFollow>;

@Schema({ timestamps: true, collection: 'company_follows' })
export class CompanyFollow {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId;
}

export const CompanyFollowSchema = SchemaFactory.createForClass(CompanyFollow);
