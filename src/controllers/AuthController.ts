import { Response } from "express";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";

/*
Refactor code:
- Move the test setup and teardown code to a separate file.

// Define the user data interface
interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Define the request interface
interface RegisterUserRequest extends Request {
  body: UserData;
}
*/

export class AuthController {
  userService: UserService;

  // Constructor injection of the UserService
  constructor(userService: UserService) {
    this.userService = userService;
  }

  async register(req: RegisterUserRequest, res: Response) {
    // Get the user data from the request body
    const { firstName, lastName, email, password } = req.body;

    // Refactor code:
    // Having the logic of database(Low Level) operations in the controller is not a good practice.
    // Decouple the controller from the database operations is one of the rule of clean architecture.
    // We should move the logic to a service(UserService.ts) and keep the controller thin.

    /*
    // Get the user repository
    const userRepository = AppDataSource.getRepository(User);

    // Save the user to the database
    await userRepository.save({ firstName, lastName, email, password });
    */

    // Problem:
    // Creating a new instance of UserService in the controller is not a good practice.
    // This make the controller tightly coupled with the service.
    // We should use dependency injection to inject the service into the controller.
    // Use a constructor to inject the service into the controller.

    /*
    const userService = new UserService();
    await userService.create();
    */

    await this.userService.create({ firstName, lastName, email, password });

    res.status(201).json();
  }
}
