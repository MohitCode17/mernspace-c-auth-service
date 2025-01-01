import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import request from "supertest";
import app from "../../src/app";

describe("GET /auth/self", () => {
  // Create a connection to the database
  let connection: DataSource;

  beforeAll(async () => {
    connection = await AppDataSource.initialize();
  });

  // Run this before each test
  beforeEach(async () => {
    await connection.dropDatabase();
    await connection.synchronize();
  });

  // Run this after all tests
  afterAll(async () => {
    await connection.destroy();
  });

  describe("Given all fields", () => {
    it("should return the 200 status code", async () => {
      const response = await request(app).get("/auth/self").send();
      expect(response.statusCode).toBe(200);
    });
  });
});
