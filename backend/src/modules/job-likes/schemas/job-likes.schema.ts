import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type JobLikeDocument = HydratedDocument<JobLike>;

@Schema({ timestamps: true, collection: 'job_likes' })
export class JobLike {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
  job: Types.ObjectId;
}

export const JobLikeSchema = SchemaFactory.createForClass(JobLike);

JobLikeSchema.index({ user: 1, job: 1 }, { unique: true });
JobLikeSchema.index({ user: 1, createdAt: -1 });
