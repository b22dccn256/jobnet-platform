import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true, collection: 'projects' })
export class Project {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop({ type: [String], default: [] })
  technologies: string[];

  @Prop()
  url: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
