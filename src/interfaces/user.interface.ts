export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  RECRUITER = 'recruiter',
  CANDIDATE = 'candidate',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
  companyId: string;
  isMainUser: boolean;
  lastSignIn?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  companyId?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenPayload {
  userId: string;
  refreshToken: string;
  expiresAt: Date;
}