export interface OtpData {
  code: string;
  expiresAt: Date;
  verified: boolean;
}

export interface OtpStorage {
  [email: string]: OtpData;
}

export interface IOtpService {
  generateOtp(email: string): Promise<string>;
  verifyOtp(email: string, otp: string): Promise<boolean>;
  sendOtpEmail(email: string, otp: string): Promise<void>;
}
