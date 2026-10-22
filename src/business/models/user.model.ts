export const UserRole = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  BLOCKED: 'BLOCKED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const AuthProvider = {
  LOCAL: 'LOCAL',
  GOOGLE: 'GOOGLE',
} as const;

export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  provider: AuthProvider;
  googleId: string | null;
  avatar: string | null;
  isVerified: boolean;
  verificationToken: string | null;
  verificationExpiresAt: Date | null;
  resetPasswordToken: string | null;
  resetPasswordExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SafeUser = Omit<User, 'passwordHash' | 'verificationToken' | 'resetPasswordToken'>;
