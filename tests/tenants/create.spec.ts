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

    it("should return all tenants list", async () => {
      // Arrange
      const tenantRepo = connection.getRepository(Tenant);

      const tenant1 = tenantRepo.create({
        name: "Tenant 1",
        address: "Address 1",
      });

      const tenant2 = tenantRepo.create({
        name: "Tenant 2",
        address: "Address 2",
      });

      await tenantRepo.save([tenant1, tenant2]);

      // Act
      const response = await request(app).get("/tenants");

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Tenant 1", address: "Address 1" }),
          expect.objectContaining({ name: "Tenant 2", address: "Address 2" }),
        ]),
      );
    });

    it("should return tenant by id", async () => {
      // Arrange
      const tenantRepo = connection.getRepository(Tenant);

      const tenant = tenantRepo.create({
        id: 1,
        name: "Tenant 1",
        address: "Address 1",
      });

      await tenantRepo.save(tenant);

      // Act
      const response = await request(app).get(`/tenants/${tenant.id}`);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({
        id: tenant.id,
        name: "Tenant 1",
        address: "Address 1",
      });
    });

    it("should allow only an admin to update a tenant", async () => {
      // Arrange
      const tenantRepo = connection.getRepository(Tenant);

      const tenant = tenantRepo.create({
        id: 1,
        name: "Tenant 1",
        address: "Address 1",
      });

      await tenantRepo.save(tenant);

      const updatedData = {
        name: "Updated tenant name",
        address: "Updated tenant address",
      };

      // Act
      const response = await request(app)
        .patch(`/tenants/${tenant.id}`)
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(updatedData);

      const updatedTenant = await tenantRepo.findOneBy({ id: tenant.id });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(updatedTenant).toEqual(
        expect.objectContaining({
          name: updatedData.name,
          address: updatedData.address,
        }),
      );
    });
  });

  describe("Fields are missing", () => {
    it("should return 400 status code if tenant name and address missing", async () => {
      // Arrange
      const tenantData = {
        name: "",
        address: "",
      };

      // Act
      const response = await request(app)
        .post("/tenants")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(tenantData);

      // Assert
      expect(response.statusCode).toBe(400);
      const tenantRepo = connection.getRepository(Tenant);
      const tenants = await tenantRepo.find();
      expect(tenants).toHaveLength(0);
    });
  });
});
