import { NextFunction, Request, Response } from "express";
import { UserService } from "../services/UserService";
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserQueryParams,
} from "../types";
import { Logger } from "winston";
import createHttpError from "http-errors";
import { matchedData, validationResult } from "express-validator";

export class UserController {
  constructor(
    private userService: UserService,
    private logger: Logger,
  ) {}

  async create(req: CreateUserRequest, res: Response, next: NextFunction) {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      res.status(400).json({ errors: result.array() });
      return;
    }

    try {
      const { firstName, lastName, email, password, role, tenantId } = req.body;

      const user = await this.userService.create({
        firstName,
        lastName,
        email,
        password,
        role,
        tenantId,
      });

      res.status(201).json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    // Only validate those query which exists in validator, else ignore.
    const validateQuery = matchedData(req, { onlyValidData: true });

    try {
      const [users, count] = await this.userService.getAll(
        validateQuery as UserQueryParams,
      );

      this.logger.info("All users have been fetched");

      res.json({
        data: users,
        currentPage: validateQuery.currentPage as number,
        perPage: validateQuery.perPage as number,
        total: count,
      });
    } catch (err) {
      next(err);
      return;
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    const userId = req.params.id;

    if (isNaN(Number(userId))) {
      next(createHttpError(400, "Invalid url param."));
      return;
    }

    try {
      const user = await this.userService.findById(Number(userId));

      if (!user) {
        next(createHttpError(400, "User does not exist."));
        return;
      }

      this.logger.info(`User has been fetched`, { id: user.id });

      res.json(user);
    } catch (err) {
      next(err);
      return;
    }
  }

  async update(req: UpdateUserRequest, res: Response, next: NextFunction) {
    // In our project: We are not allowing user to change the email id since it is used as username
    // In our project: We are not allowing admin user to change others password
    const result = validationResult(req);

    if (!result.isEmpty()) {
      res.status(400).json({ errors: result.array() });
      return;
    }

    const userId = req.params.id;
    const { firstName, lastName, role, email, tenantId } = req.body;

    if (isNaN(Number(userId))) {
      next(createHttpError(400, "Invalid url param."));
      return;
    }

    this.logger.debug("Request for updating a user", req.body);

    try {
      await this.userService.update(Number(userId), {
        firstName,
        lastName,
        role,
        email,
        tenantId,
      });

      this.logger.info("User has been updated", { id: userId });

      res.json({ id: Number(userId) });
    } catch (err) {
      next(err);
      return;
    }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    const userId = req.params.id;

    if (isNaN(Number(userId))) {
      next(createHttpError(400, "Invalid url param."));
      return;
    }

    try {
      await this.userService.deleteById(Number(userId));

      this.logger.info("User has been deleted", { id: Number(userId) });

      res.json({ id: Number(userId) });
    } catch (err) {
      next(err);
      return;
    }
  }
}
