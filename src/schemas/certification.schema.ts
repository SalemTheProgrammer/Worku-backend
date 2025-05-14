import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Certification {
  @Prop({ type: String })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  issuingOrganization: string;

  @Prop({ required: true, type: String })
  issueDate: string;

  @Prop({ type: String })
  expiryDate?: string;

  @Prop()
  credentialId?: string;

  @Prop()
  credentialUrl?: string;

  @Prop({ type: Boolean, default: false })
  isExpired?: boolean;

  @Prop()
  description?: string;

  @Prop([String])
  skills?: string[];
}

export const CertificationSchema = SchemaFactory.createForClass(Certification);

// Add a pre-save hook to update isExpired based on expiryDate
CertificationSchema.pre('save', function(next) {
  const today = new Date().toISOString().split('T')[0];
  if (this.expiryDate) {
    this.isExpired = this.expiryDate < today;
  } else {
    this.isExpired = false;
  }
  next();
});