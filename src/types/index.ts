import { Request } from "express";

// Define the user data interface
export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  tenantId?: number;
}

// Define the request interface
export interface RegisterUserRequest extends Request {
  body: UserData;
}

export interface AuthRequest extends Request {
  auth: {
    sub: string;
    role: string;
    id?: string;
    tenant: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export type AuthCookie = {
  accessToken: string;
  refreshToken: string;
};

export interface IRefreshTokenPayload {
  id: string;
}

export interface ITenantData {
  name: string;
  address: string;
}

export interface CreateTenantRequest extends Request {
  body: ITenantData;
}

export interface CreateUserRequest extends Request {
  body: UserData;
}

export interface LimitedUserData {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  tenantId: number;
}

export interface UpdateUserRequest extends Request {
  body: LimitedUserData;
}

export interface UserQueryParams {
  perPage: number;
  currentPage: number;
  q: string;
  role: string;
}
