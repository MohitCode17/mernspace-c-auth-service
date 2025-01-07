import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import request from "supertest";
import app from "../../src/app";
import { Tenant } from "../../src/entity/Tenant";
import createJWKSMock from "mock-jwks";
import { ROLES } from "../../src/constants";

describe("PATCH /tenants", () => {
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
});
