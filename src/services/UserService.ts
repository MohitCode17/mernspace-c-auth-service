import { Repository } from "typeorm";
import { User } from "../entity/User";
import { LimitedUserData, UserData } from "../types";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";

// Define the user service
export class UserService {
  // Constructor injection of the User repository
  constructor(private userRepository: Repository<User>) {}

  // Implement the create method
  async create({
    firstName,
    lastName,
    email,
    password,
    role,
    tenantId,
  }: UserData) {
    // Check if the user already exists in the database by email
    const user = await this.userRepository.findOne({ where: { email: email } });

    if (user) {
      const err = createHttpError(404, "Email already exists");
      throw err;
    }

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
        role,
        tenant: tenantId ? { id: tenantId } : undefined,
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      const error = createHttpError(500, "Failed to create user");
      throw error;
    }
  }

  // Implement the findByEmail method
  async findByEmailWithPassword(email: string) {
    return await this.userRepository.findOne({
      where: {
        email,
      },
      select: ["id", "firstName", "lastName", "email", "password", "role"],
    });
  }

  async findById(id: number) {
    return await this.userRepository.findOne({
      where: {
        id,
      },
      relations: {
        tenant: true,
      },
    });
  }

  async getAll() {
    return await this.userRepository.find();
  }

  async update(userId: number, { firstName, lastName, role }: LimitedUserData) {
    return await this.userRepository.update(userId, {
      firstName,
      lastName,
      role,
    });
  }

  async deleteById(userId: number) {
    return this.userRepository.delete(userId);
  }
}
