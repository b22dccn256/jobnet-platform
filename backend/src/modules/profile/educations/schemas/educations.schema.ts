import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type EducationDocument = HydratedDocument<Education>;

@Schema({ timestamps: true, collection: 'educations' })
export class Education {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop()
  school: string;

  @Prop()
  major: string;

  @Prop()
  degree: string;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;
}

export const EducationSchema = SchemaFactory.createForClass(Education);
