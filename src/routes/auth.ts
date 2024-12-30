import express, { NextFunction, Request, Response } from "express";
import { AuthController } from "../controllers/AuthController";
import { UserService } from "../services/UserService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import logger from "../config/logger";
import registerValidator from "../validators/register-validator";
import { TokenService } from "../services/TokenService";

const router = express.Router();

// Create a new instance of the User repository
const userRepository = AppDataSource.getRepository(User);
// Create a new instance of the UserService and injected into the AuthController
const userService = new UserService(userRepository);
// Create a new instance of the tokenService and injected into the AuthController
const tokenServerice = new TokenService();
const authController = new AuthController(userService, logger, tokenServerice);

router.post(
  "/register",
  registerValidator,
  (req: Request, res: Response, next: NextFunction) =>
    authController.register(req, res, next),
);

export default router;
