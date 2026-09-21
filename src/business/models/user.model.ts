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

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}

export type SafeUser = Omit<User, 'passwordHash'>;
