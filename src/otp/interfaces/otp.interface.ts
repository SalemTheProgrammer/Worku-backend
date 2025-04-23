import { Document } from 'mongoose';

export interface Otp extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
}