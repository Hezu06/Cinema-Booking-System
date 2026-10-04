import type { User, SafeUser, UserRole, UserStatus } from "../models/user.model.js";

export interface CreateUserData {
  fullName: string;
  email: string;
  passwordHash: string;
  phone: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<SafeUser | null>;
  create(data: CreateUserData): Promise<SafeUser>;
}
