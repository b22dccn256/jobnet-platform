import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';
import { JobStatus } from '../../../common/enums/job-status.enum';

export type JobDocument = HydratedDocument<Job>;

@Schema({ timestamps: true, collection: 'jobs' })
export class Job {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: false })
  category: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  benefits: string;

  @Prop()
  requirements: string;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop()
  location: string;

  @Prop({ enum: ['onsite', 'remote', 'hybrid'], default: 'onsite' })
  workMode: string;

  @Prop({ enum: ['intern', 'junior', 'middle', 'senior'], default: 'junior' })
  level: string;

  @Prop()
  education: string;

  @Prop()
  salaryMin: number;

  @Prop()
  salaryMax: number;

  @Prop()
  deadline: Date;

  @Prop({ type: String, enum: Object.values(JobStatus), default: JobStatus.Pending })
  status: string;

  @Prop()
  rejectReason: string;
}

export const JobSchema = SchemaFactory.createForClass(Job);
