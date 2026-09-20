import type { SafeUser } from "../models/user.model.js";

export interface RegisterDTO {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResult {
  user: SafeUser;
  accessToken: string;
}
