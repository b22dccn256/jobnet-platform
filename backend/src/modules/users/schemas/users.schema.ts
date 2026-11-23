import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../../common/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: String, enum: Object.values(Role), default: Role.Candidate })
  role: string;

  @Prop({ trim: true })
  fullName: string;

  @Prop()
  phone: string;

  @Prop()
  avatar: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ select: false })
  resetPasswordToken?: string;

  @Prop({ select: false })
  resetPasswordExpires?: Date;

  // Hồ sơ nghề nghiệp & cài đặt CV cho ứng viên (theo SCHEMA.md ghi chú #3)
  @Prop({ trim: true })
  bio?: string;

  @Prop({ type: [String], default: [] })
  skills?: string[];

  @Prop({ trim: true })
  desiredTitle?: string;

  @Prop({ enum: ['intern', 'junior', 'middle', 'senior'] })
  desiredLevel?: string;

  @Prop()
  desiredSalaryMin?: number;

  @Prop({ trim: true })
  desiredLocation?: string;

  @Prop()
  cvUrl?: string;

  @Prop({ enum: ['modern', 'classic', 'minimal'], default: 'modern' })
  cvTemplate?: string;

  @Prop({ default: false })
  isCvPublic?: boolean;

  @Prop({ unique: true, sparse: true })
  cvShareToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
