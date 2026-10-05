import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type LanguageDocument = HydratedDocument<Language>;

@Schema({ timestamps: true, collection: 'language' })
export class Language {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  level: string;
}

export const LanguageSchema = SchemaFactory.createForClass(Language);
