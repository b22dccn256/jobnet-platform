import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type CourseDocument = HydratedDocument<Course>;

@Schema({ timestamps: true, collection: 'courses' })
export class Course {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  organization: string;

  @Prop()
  date: Date;

  @Prop()
  description?: string;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
