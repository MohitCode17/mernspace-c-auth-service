import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import request from "supertest";
import app from "../../src/app";
import { Tenant } from "../../src/entity/Tenant";
import createJWKSMock from "mock-jwks";
import { ROLES } from "../../src/constants";

describe("GET /tenants", () => {
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
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Tenant 1", address: "Address 1" }),
          expect.objectContaining({ name: "Tenant 2", address: "Address 2" }),
        ]),
      );
    });

    it("should return tenant by id", async () => {
      const adminToken = jwks.token({
        sub: "1",
        role: ROLES.ADMIN,
      });

      // Arrange
      const tenantRepo = connection.getRepository(Tenant);

      const tenant = tenantRepo.create({
        id: 1,
        name: "Tenant 1",
        address: "Address 1",
      });

      await tenantRepo.save(tenant);

      // Act
      const response = await request(app)
        .get(`/tenants/${tenant.id}`)
        .set("Cookie", [`accessToken=${adminToken}`])
        .send();

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({
        id: tenant.id,
        name: "Tenant 1",
        address: "Address 1",
      });
    });
  });
});
