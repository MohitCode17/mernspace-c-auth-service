import { NextFunction, Request, Response } from "express";

export class UserController {
  create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json({});
    } catch (err) {
      next(err);
      return;
    }
  }
}
