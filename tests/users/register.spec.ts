import request from "supertest";
import app from "../../src/app";
import { User } from "../../src/entity/User";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { truncateTables } from "../utils";

describe("POST /auth/register", () => {
  // Create a connection to the database
  let connection: DataSource;

  // Run this before all tests
  beforeAll(async () => {
    // Initialize the connection to the database
    connection = await AppDataSource.initialize();
  });

  // Run this before each test
  beforeEach(async () => {
    // Clear the database, so that we can start fresh for each test case.
    await truncateTables(connection);
  });

  // Run this after all tests
  afterAll(async () => {
    // Close the connection
    await connection.destroy();
  });

  // Happy path
  describe("Given all fields", () => {
    it("should return the 201 status code", async () => {
      // Arrange
      const userData = {
        firstName: "Mohit",
        lastName: "Gupta",
        email: "mohit@mern.space",
        password: "password",
      };

      // Act
      const response = await request(app).post("/auth/register").send(userData);

      // Assert
      expect(response.statusCode).toBe(201);
    });

    it("should return valid json response", async () => {
      // Arrange
      const userData = {
        firstName: "Mohit",
        lastName: "Gupta",
        email: "mohit@mern.space",
        password: "password",
      };

      // Act
      const response = await request(app).post("/auth/register").send(userData);

      // Assert application/json
      expect(response.headers["content-type"]).toEqual(
        expect.stringContaining("json"),
      );
    });

    it("should persist the user in the database", async () => {
      // Arrange
      const userData = {
        firstName: "Mohit",
        lastName: "Gupta",
        email: "mohit@mern.space",
        password: "password",
      };

      // Act
      await request(app).post("/auth/register").send(userData);

      // Assert
      const userRepository = connection.getRepository(User); // Get the user repository
      const user = await userRepository.find(); // Get all users from the database
      expect(user).toHaveLength(1); // Expect 1 user to be in the database

      // Ideally, we use one expect per test case, but for the sake of simplicity, we are using multiple expects in one test case.
      expect(user[0].firstName).toBe(userData.firstName); // Expect the first name to be the same
      expect(user[0].lastName).toBe(userData.lastName); //Expect the last name to be the same
      expect(user[0].email).toBe(userData.email); // Expect the email to be the same
    });
  });

  // Sad path
  describe("Fields are missing", () => {});
});
