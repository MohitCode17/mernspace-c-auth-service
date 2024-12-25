import { Repository } from "typeorm";
import { User } from "../entity/User";
import { UserData } from "../types";

// Define the user service
export class UserService {
  // Constructor injection of the User repository
  constructor(private userRepository: Repository<User>) {}

  // Implement the create method
  async create({ firstName, lastName, email, password }: UserData) {
    // Get the user repository

    // This is also coupled with repository, without repository usersevice is not working.
    // We should use dependency injection to inject the repository into the service.
    // const userRepository = AppDataSource.getRepository(User);

    // Save the user to the database
    await this.userRepository.save({ firstName, lastName, email, password });
  }
}
