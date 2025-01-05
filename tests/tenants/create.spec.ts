import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import request from "supertest";
import app from "../../src/app";
import { Tenant } from "../../src/entity/Tenant";

describe("POST /tenants", () => {
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
    it("should return a 201 status code", async () => {
      // Arrange
      const tenantData = {
        name: "Tenant name",
        address: "Tenant address",
      };

      // Act
      const response = await request(app).post("/tenants").send(tenantData);

      // Assert
      expect(response.statusCode).toBe(201);
    });

    it("should create a tenant in the database", async () => {
      // Arrange
      const tenantData = {
        name: "Tenant name",
        address: "Tenant address",
      };

      // Act
      await request(app).post("/tenants").send(tenantData);

      const tenantRepo = connection.getRepository(Tenant);
      const tenants = await tenantRepo.find();

      // Assert
      expect(tenants).toHaveLength(1);
      expect(tenants[0].name).toBe(tenantData.name);
      expect(tenants[0].address).toBe(tenantData.address);
    });
  });
});