import { NextFunction, Response } from "express";
import { AuthRequest, RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { JwtPayload } from "jsonwebtoken";
import { validationResult } from "express-validator";
import { TokenService } from "../services/TokenService";
import createHttpError from "http-errors";
import { CredentialService } from "../services/CredentialService";
import { ROLES } from "../constants";
import { Config } from "../config";

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
      next(createHttpError(400, result.array()[0].msg as string));
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
        role: ROLES.CUSTOMER,
      });

      this.logger.info(`User has been registered`, { id: user.id });

      // Generate the payload for the access token
      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
        // add tenant id to the payload
        tenant: user.tenant ? String(user.tenant.id) : "",

        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      };

      // Generate the access token
      const accessToken = this.tokenService.generateAccessToken(payload);

      // Persist the refresh token in the database
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);

      // Generate the refresh token
      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      });

      // Set the cookies
      res.cookie("accessToken", accessToken, {
        domain: Config.MAIN_DOMAIN,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60, // 1 hour
        httpOnly: true, // This cookie can't be accessed by JavaScript
      });

      res.cookie("refreshToken", refreshToken, {
        domain: Config.MAIN_DOMAIN,
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
      next(createHttpError(400, result.array()[0].msg as string));
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
      const user = await this.userService.findByEmailWithPassword(email);
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

      // Generate the payload
      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
        tenant: user.tenant ? user.tenant.id : "",
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      };

      // Generate the access token
      const accessToken = this.tokenService.generateAccessToken(payload);

      // Persist the refresh token in the database
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);

      // Generate the refresh token
      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      });

      // Set the cookies
      res.cookie("accessToken", accessToken, {
        domain: Config.MAIN_DOMAIN,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60, // 1 hour
        httpOnly: true, // This cookie can't be accessed by JavaScript
      });

      res.cookie("refreshToken", refreshToken, {
        domain: Config.MAIN_DOMAIN,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        httpOnly: true, // This cookie can't be accessed by JavaScript
      });

      this.logger.info("User has been logged in", { id: user.id });

      res.status(200).json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }

  async self(req: AuthRequest, res: Response) {
    const user = await this.userService.findById(Number(req.auth.sub));
    res.json({ ...user, password: undefined });
  }

  async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    // If Refresh token is valid, create a new access token.
    try {
      const payload: JwtPayload = {
        sub: req.auth.sub,
        role: req.auth.role,
        tenant: req.auth.tenant,
        firstName: req.auth.firstName,
        lastName: req.auth.lastName,
        email: req.auth.email,
      };

      const accessToken = this.tokenService.generateAccessToken(payload);

      const user = await this.userService.findById(Number(req.auth.sub));

      if (!user) {
        const error = createHttpError(
          400,
          "User with the token could not find",
        );
        next(error);
        return;
      }

      // Persist refresh token to database
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);

      // Delete old refresh token
      await this.tokenService.deleteRefreshToken(Number(req.auth.id));

      // Generate refresh token
      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      });

      // Send tokens to cookie
      res.cookie("accessToken", accessToken, {
        domain: Config.MAIN_DOMAIN,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60, // 1 hour
        httpOnly: true, // This cookie can't be accessed by JavaScript
      });

      res.cookie("refreshToken", refreshToken, {
        domain: Config.MAIN_DOMAIN,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        httpOnly: true, // This cookie can't be accessed by JavaScript
      });

      this.logger.info("User has been logged in", { id: user.id });

      res.status(200).json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Delete refresh token
      await this.tokenService.deleteRefreshToken(Number(req.auth.id));

      this.logger.info("Refresh token has been deleted", { id: req.auth.id });

      this.logger.info("User has been logged out", { id: req.auth.sub });

      // Clear access token
      res.clearCookie("accessToken");

      // Clear refresh token
      res.clearCookie("refreshToken");

      // send success response
      res.json({});
    } catch (err) {
      next(err);
      return;
    }
  }
}
