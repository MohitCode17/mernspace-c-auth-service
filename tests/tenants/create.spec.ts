import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import request from "supertest";
import app from "../../src/app";
import { Tenant } from "../../src/entity/Tenant";
import createJWKSMock from "mock-jwks";
import { ROLES } from "../../src/constants";

describe("POST /tenants", () => {
  // Create a connection to the database
  let connection: DataSource;
  let jwks: ReturnType<typeof createJWKSMock>;
  let adminToken: string;

  beforeAll(async () => {
    jwks = createJWKSMock("http://localhost:5501");
    connection = await AppDataSource.initialize();
  });

  // Run this before each test
  beforeEach(async () => {
    jwks.start();
    await connection.dropDatabase();
    await connection.synchronize();

    adminToken = jwks.token({
      sub: "1",
      role: ROLES.ADMIN,
    });
  });

  afterEach(() => {
    jwks.stop();
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
      const response = await request(app)
        .post("/tenants")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(tenantData);

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
      await request(app)
        .post("/tenants")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(tenantData);

      const tenantRepo = connection.getRepository(Tenant);
      const tenants = await tenantRepo.find();

      // Assert
      expect(tenants).toHaveLength(1);
      expect(tenants[0].name).toBe(tenantData.name);
      expect(tenants[0].address).toBe(tenantData.address);
    });

    it("should return 401 if user is not authenticated", async () => {
      // Arrange
      const tenantData = {
        name: "Tenant name",
        address: "Tenant address",
      };

      // Act
      const response = await request(app).post("/tenants").send(tenantData);
      const tenantRepo = connection.getRepository(Tenant);
      const tenants = await tenantRepo.find();

      // Assert
      expect(response.statusCode).toBe(401);
      expect(tenants).toHaveLength(0);
    });

    it("should return 403 if user is not an admin", async () => {
      // Arrange
      const managerToken = jwks.token({
        sub: "1",
        role: ROLES.MANAGER,
      });

      const tenantData = {
        name: "Tenant name",
        address: "Tenant address",
      };

      // Act
      const response = await request(app)
        .post("/tenants")
        .set("Cookie", [`accessToken=${managerToken}`])
        .send(tenantData);
      const tenantRepo = connection.getRepository(Tenant);
      const tenants = await tenantRepo.find();

      // Assert
      expect(response.statusCode).toBe(403);
      expect(tenants).toHaveLength(0);
    });
  });
});
