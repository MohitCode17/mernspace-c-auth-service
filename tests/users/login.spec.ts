import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entity/User";
import { ROLES } from "../../src/constants";
import request from "supertest";
import app from "../../src/app";
import bcrypt from "bcrypt";
import { isJwt } from "../utils";

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

    it("should return access token and refresh token inside a cookies", async () => {
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
        password: userData.password,
      });

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
});
