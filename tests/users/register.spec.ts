import request from "supertest";
import app from "../../src/app";
import { User } from "../../src/entity/User";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { ROLES } from "../../src/constants";
import { isJwt } from "../utils";

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
    // Why not truncateTables?
    // Because truncateTables only truncates the tables, but does not re-build the database schema.
    // So, we drop the database and re-synchronize it.
    await connection.dropDatabase(); // Drop the database
    await connection.synchronize(); // Sync the database
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

    it("should return an id of the created user", async () => {
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
      expect(response.body).toHaveProperty("id");
      const userRepository = connection.getRepository(User);
      const user = await userRepository.find();
      // Check if the id returned in the response is the same as the id in the database
      expect((response.body as Record<string, string>).id).toBe(user[0].id);
    });

    it("should assign a customer role", async () => {
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
      const userRepository = connection.getRepository(User);
      const user = await userRepository.find();

      // Assert
      expect(user[0]).toHaveProperty("role");
      expect(user[0].role).toBe(ROLES.CUSTOMER);
    });

    it("should store the hashed password to the database", async () => {
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
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users[0].password).not.toBe(userData.password);
      expect(users[0].password).toHaveLength(60);
      expect(users[0].password).toMatch(/^\$2[ayb]\$\d+\$/);
    });

    it("should return 404 status code if email is already exists", async () => {
      // Arrange
      const userData = {
        firstName: "Mohit",
        lastName: "Gupta",
        email: "mohit@mern.space",
        password: "password",
      };
      // Create a user in the database
      const userRepository = connection.getRepository(User);
      await userRepository.save({ ...userData, role: ROLES.CUSTOMER });

      const users = await userRepository.find();

      // Act
      const response = await request(app).post("/auth/register").send(userData);

      // Assert
      expect(response.statusCode).toBe(404);
      expect(users).toHaveLength(1);
    });

    it("should return access token and refresh token inside a cookie", async () => {
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
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      // Normalize `cookies` to always be an array
      const cookies = Array.isArray(response.headers["set-cookie"])
        ? response.headers["set-cookie"]
        : [response.headers["set-cookie"]].filter(Boolean);

      cookies.forEach((cookie) => {
        if (typeof cookie === "string") {
          if (cookie.startsWith("accessToken=")) {
            accessToken = cookie.split(";")[0].split("=")[1];
          }
          if (cookie.startsWith("refreshToken=")) {
            refreshToken = cookie.split(";")[0].split("=")[1];
          }
        }
      });
      expect(accessToken).not.toBeNull();
      expect(refreshToken).not.toBeNull();
      // Check if the tokens are JWT
      expect(isJwt(accessToken)).toBeTruthy();
      expect(isJwt(refreshToken)).toBeTruthy();
    });
  });

  // Sad path
  describe("Fields are missing", () => {
    it("should return 400 status code if email field is missing", async () => {
      // Arrange
      const userData = {
        firstName: "Mohit",
        lastName: "Gupta",
        email: "",
        password: "password",
      };

      // Act
      const response = await request(app).post("/auth/register").send(userData);

      // Assert
      expect(response.statusCode).toBe(400);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users).toHaveLength(0);
    });
  });

  describe("Fields are not in proper format", () => {
    it("should trim the email field", async () => {
      // Arrange
      const userData = {
        firstName: "Mohit",
        lastName: "Gupta",
        email: " mohit@mern.space",
        password: "password",
      };

      // Act
      await request(app).post("/auth/register").send(userData);

      // Assert
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      const user = users[0];
      expect(user.email).toBe("mohit@mern.space");
    });
  });
});
