import { NextFunction, Response } from "express";
import { UserService } from "../services/UserService";
import { CreateUserRequest } from "../types";

export class UserController {
  constructor(private userService: UserService) {}

  async create(req: CreateUserRequest, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, email, password } = req.body;

      const user = await this.userService.create({
        firstName,
        lastName,
        email,
        password,
      });

      res.status(201).json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }
}
