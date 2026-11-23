import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';
import { ApplicationStatus } from '../../../common/enums/application-status.enum';

export type ApplicationDocument = HydratedDocument<Application>;

@Schema({ timestamps: true, collection: 'candidates' })
export class Application {
  @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
  job: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop()
  cvUrl: string;

  @Prop()
  coverLetter: string;

  @Prop({ type: String, enum: Object.values(ApplicationStatus), default: ApplicationStatus.Applied })
  status: string;

  @Prop({ default: Date.now })
  appliedAt: Date;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

ApplicationSchema.index({ job: 1, user: 1 }, { unique: true });
ApplicationSchema.index({ user: 1, appliedAt: -1 });
