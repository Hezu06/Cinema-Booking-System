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

export interface GoogleAuthDTO {
  idToken: string;
}

export interface VerifyEmailDTO {
  email: string;
  code: string;
}

export interface ResendVerificationDTO {
  email: string;
  force?: boolean;
}

export interface RegisterResult {
  user: SafeUser;
  requireVerification: boolean;
  message: string;
}

export interface AuthResult {
  user: SafeUser;
  accessToken: string;
}
