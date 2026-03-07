export enum UserRole {
  ADMIN = 'admin',
  BASIC = 'basic'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface VideoUploadResponse {
  jobId: string;
  message: string;
}

export interface VideoStatus {
  id: string;
  state: 'waiting' | 'active' | 'completed' | 'failed';
  progress: string;
  result: unknown | null;
  error: string | null;
}

export enum VideoStatusEnum {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface Video {
  id: string;
  size: number;
  file_name: string;
  extension: string;
  status: VideoStatusEnum;
  createdAt: string;
  updatedAt: string;
  userId: string;
}
