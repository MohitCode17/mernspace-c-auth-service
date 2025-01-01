import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entity/User";
import { ROLES } from "../../src/constants";
import request from "supertest";
import app from "../../src/app";
import bcrypt from "bcrypt";

describe("POST /auth/login", () => {
  // Create a connection to the database
  let connection: DataSource;

  beforeAll(async () => {
    // Initialize the connection
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await connection.dropDatabase();
    await connection.synchronize();
  });

  afterAll(async () => {
    await connection.destroy();
  });

  describe("Given all fields", () => {
    it("should return 400 status code if email or password is wrong", async () => {
      // Arrange
      const userData = {
        firstName: "Mohit",
        lastName: "Gupta",
        email: "mohit@mern.space",
        password: "password",
      };

      const hashPassword = await bcrypt.hash(userData.password, 10);
      const userRepository = connection.getRepository(User);
      await userRepository.save({
        ...userData,
        password: hashPassword,
        role: ROLES.CUSTOMER,
      });

      // Act
      const response = await request(app).post("/auth/login").send({
        email: userData.email,
        password: "wrongpassword",
      });

      // Assert
      expect(response.statusCode).toBe(400);
    });
  });
});
