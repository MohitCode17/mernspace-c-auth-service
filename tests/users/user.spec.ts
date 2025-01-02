import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import request from "supertest";
import createJWKSMock from "mock-jwks";
import app from "../../src/app";
import { User } from "../../src/entity/User";
import { ROLES } from "../../src/constants";

describe("GET /auth/self", () => {
  // Create a connection to the database
  let connection: DataSource;
  let jwks: ReturnType<typeof createJWKSMock>;

  beforeAll(async () => {
    jwks = createJWKSMock("http://localhost:5501");
    connection = await AppDataSource.initialize();
  });

  // Run this before each test
  beforeEach(async () => {
    jwks.start();
    await connection.dropDatabase();
    await connection.synchronize();
  });

  afterEach(() => {
    jwks.stop();
  });

  // Run this after all tests
  afterAll(async () => {
    await connection.destroy();
  });

  describe("Given all fields", () => {
    it("should return the 200 status code", async () => {
      const accessToken = jwks.token({
        sub: "1",
        role: ROLES.CUSTOMER,
      });
      const response = await request(app)
        .get("/auth/self")
        .set("Cookie", [`accessToken=${accessToken}`])
        .send();
      expect(response.statusCode).toBe(200);
    });

    it("should return the user data", async () => {
      const userData = {
        firstName: "Mohit",
        lastName: "Gupta",
        email: "mohit@mern.space",
        password: "password",
      };
      // Register user
      const userRepository = connection.getRepository(User);
      const user = await userRepository.save({
        ...userData,
        role: ROLES.CUSTOMER,
      });

      // Generate token
      const accessToken = jwks.token({ sub: String(user.id), role: user.role });

      // Add token to cookies
      const response = await request(app)
        .get("/auth/self")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      // Assert
      // Check if user id matches with registered user
      expect((response.body as Record<string, string>).id).toBe(user.id);
    });

    it("should not return the password field", async () => {
      const userData = {
        firstName: "Mohit",
        lastName: "Gupta",
        email: "mohit@mern.space",
        password: "password",
      };
      // Register user
      const userRepository = connection.getRepository(User);
      const user = await userRepository.save({
        ...userData,
        role: ROLES.CUSTOMER,
      });

      // Generate token
      const accessToken = jwks.token({ sub: String(user.id), role: user.role });

      // Add token to cookies
      const response = await request(app)
        .get("/auth/self")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      // Assert
      // Check if user id matches with registered user
      expect(response.body as Record<string, string>).not.toHaveProperty(
        "password",
      );
    });

    it("should return 401 status code if token does not exists", async () => {
      const userData = {
        firstName: "Mohit",
        lastName: "Gupta",
        email: "mohit@mern.space",
        password: "password",
      };
      // Register user
      const userRepository = connection.getRepository(User);
      await userRepository.save({
        ...userData,
        role: ROLES.CUSTOMER,
      });

      const response = await request(app).get("/auth/self").send();

      // Assert
      // Check if user id matches with registered user
      expect(response.statusCode).toBe(401);
    });
  });
});
