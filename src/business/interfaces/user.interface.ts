import type { User, SafeUser, UserRole, UserStatus, AuthProvider } from "../models/user.model.js";

export interface CreateUserData {
  fullName: string;
  email: string;
  passwordHash?: string | null;
  phone?: string | null;
  role?: UserRole;
  status?: UserStatus;
  provider?: AuthProvider;
  googleId?: string | null;
  avatar?: string | null;
  isVerified?: boolean;
  verificationToken?: string | null;
  verificationExpiresAt?: Date | null;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findById(id: string): Promise<SafeUser | null>;
  findWithPasswordById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<SafeUser>;
  update(id: string, data: Partial<User>): Promise<SafeUser>;
}
