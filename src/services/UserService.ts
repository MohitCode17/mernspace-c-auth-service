import { Repository } from "typeorm";
import { User } from "../entity/User";
import { UserData } from "../types";
import createHttpError from "http-errors";

// Define the user service
export class UserService {
  // Constructor injection of the User repository
  constructor(private userRepository: Repository<User>) {}

  // Implement the create method
  async create({ firstName, lastName, email, password }: UserData) {
    try {
      // Save the user to the database
      return await this.userRepository.save({
        firstName,
        lastName,
        email,
        password,
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      const error = createHttpError(500, "Failed to create user");
      throw error;
    }
  }
}
