import { NextFunction, Response } from "express";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { JwtPayload } from "jsonwebtoken";
import { validationResult } from "express-validator";
import { TokenService } from "../services/TokenService";
import createHttpError from "http-errors";
import { CredentialService } from "../services/CredentialService";

export class AuthController {
  // Constructor injection of the UserService, Logger
  constructor(
    private userService: UserService,
    private logger: Logger,
    private tokenService: TokenService,
    private credentialService: CredentialService,
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

      // Generate the payload for the access token
      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };

      // Generate the access token
      const accessToken = this.tokenService.generateAccessToken(payload);

      // Persist the refresh token in the database
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);

      // Generate the refresh token
      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: newRefreshToken.id,
      });

      // Set the cookies
      res.cookie("accessToken", accessToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60, // 1 hour
        httpOnly: true, // This cookie can't be accessed by JavaScript
      });

      res.cookie("refreshToken", refreshToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        httpOnly: true, // This cookie can't be accessed by JavaScript
      });

      res.status(201).json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }

  async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
    // Validate the request
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({ errors: result.array() });
      return;
    }

    // Get data from body
    const { email, password } = req.body;

    this.logger.debug("New request to login a user", {
      email,
      password: "********",
    });

    try {
      // Check if user email is exists in database
      const user = await this.userService.findByEmail(email);
      if (!user) {
        const error = createHttpError(400, "Email or password does not match.");
        next(error);
        return;
      }
      // Compare the password
      const passwordMatch = await this.credentialService.comparePassword(
        password,
        user.password,
      );

      if (!passwordMatch) {
        const error = createHttpError(400, "Email or password does not match.");
        next(error);
        return;
      }

      // Generate the payload for the access token
      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };

      // Generate the access token
      const accessToken = this.tokenService.generateAccessToken(payload);

      // Persist the refresh token in the database
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);

      // Generate the refresh token
      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: newRefreshToken.id,
      });

      // Set the cookies
      res.cookie("accessToken", accessToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60, // 1 hour
        httpOnly: true, // This cookie can't be accessed by JavaScript
      });

      res.cookie("refreshToken", refreshToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        httpOnly: true, // This cookie can't be accessed by JavaScript
      });

      res.status(200).json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }
}
