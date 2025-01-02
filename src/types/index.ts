import { Request } from "express";

// Define the user data interface
export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Define the request interface
export interface RegisterUserRequest extends Request {
  body: UserData;
}

export interface AuthRequest extends Request {
  auth: {
    id: number;
    role: string;
  };
}
