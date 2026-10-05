import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type WorkExperienceDocument = HydratedDocument<WorkExperience>;

@Schema({ timestamps: true, collection: 'work_experience' })
export class WorkExperience {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop()
  position: string;

  @Prop()
  company: string;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop()
  description: string;
}

export const WorkExperienceSchema = SchemaFactory.createForClass(WorkExperience);
