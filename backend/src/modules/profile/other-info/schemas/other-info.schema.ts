import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type OtherInfoDocument = HydratedDocument<OtherInfo>;

@Schema({ timestamps: true, collection: 'other_info' })
export class OtherInfo {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop()
  content: string;

  @Prop()
  religion?: string;

  @Prop()
  hometown?: string;

  @Prop()
  emergencyContact?: string;
}

export const OtherInfoSchema = SchemaFactory.createForClass(OtherInfo);
