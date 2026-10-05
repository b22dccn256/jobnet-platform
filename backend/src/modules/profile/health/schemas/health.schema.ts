import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type HealthDocument = HydratedDocument<Health>;

@Schema({ timestamps: true, collection: 'health' })
export class Health {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop()
  height: number;

  @Prop()
  weight: number;

  @Prop()
  note: string;
}

export const HealthSchema = SchemaFactory.createForClass(Health);
