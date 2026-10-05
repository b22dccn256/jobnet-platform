import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type CompanyDocument = HydratedDocument<Company>;

@Schema({ timestamps: true, collection: 'companies' })
export class Company {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  logo: string;

  @Prop()
  description: string;

  @Prop()
  address: string;

  @Prop()
  website: string;

  @Prop()
  size: string;

  @Prop()
  industry: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
