import { Repository } from "typeorm";
import { User } from "../entity/User";
import { UserData } from "../types";
import createHttpError from "http-errors";
import { ROLES } from "../constants";
import bcrypt from "bcrypt";

// Define the user service
export class UserService {
  // Constructor injection of the User repository
  constructor(private userRepository: Repository<User>) {}

  // Implement the create method
  async create({ firstName, lastName, email, password }: UserData) {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
      // Save the user to the database
      return await this.userRepository.save({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: ROLES.CUSTOMER,
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      const error = createHttpError(500, "Failed to create user");
      throw error;
    }
  }
}
