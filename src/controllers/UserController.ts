import { NextFunction, Request, Response } from "express";
import { UserService } from "../services/UserService";
import { CreateUserRequest } from "../types";
import { ROLES } from "../constants";
import { Logger } from "winston";

export class UserController {
  constructor(
    private userService: UserService,
    private logger: Logger,
  ) {}

  async create(req: CreateUserRequest, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, email, password } = req.body;

      const user = await this.userService.create({
        firstName,
        lastName,
        email,
        password,
        role: ROLES.MANAGER,
      });

      res.status(201).json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await this.userService.getAll();

      this.logger.info("All users have been fetched");

      res.json(users);
    } catch (err) {
      next(err);
      return;
    }
  }
}
