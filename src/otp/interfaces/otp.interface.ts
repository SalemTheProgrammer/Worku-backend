export interface OtpData {
  code: string;
  expiresAt: Date;
  verified: boolean;
}

export interface IOtpService {
  generateOtp(email: string, company: any): Promise<string>;
  verifyOtp(email: string, otp: string): Promise<boolean>;
  sendOtpEmail(email: string, otp: string): Promise<void>;
}

export interface OtpStorage {
  [email: string]: OtpData;
}