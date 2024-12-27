import { NextFunction, Response } from "express";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";

export class AuthController {
  // Constructor injection of the UserService, Logger
  constructor(
    private userService: UserService,
    private logger: Logger,
  ) {}

  async register(req: RegisterUserRequest, res: Response, next: NextFunction) {
    // Validate the request
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({ errors: result.array() });
      return;
    }

    // Get the user data from the request body
    const { firstName, lastName, email, password } = req.body;

    this.logger.debug("Registering a new user", {
      firstName,
      lastName,
      email,
      password: "********",
    });

    try {
      // Call the create method of the UserService
      const user = await this.userService.create({
        firstName,
        lastName,
        email,
        password,
      });

      this.logger.info(`User has been registered`, { id: user.id });
      res.status(201).json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }
}
