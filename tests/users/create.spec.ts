import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import request from "supertest";
import createJWKSMock from "mock-jwks";
import app from "../../src/app";
import { ROLES } from "../../src/constants";
import { User } from "../../src/entity/User";
import { Tenant } from "../../src/entity/Tenant";
import { createTenant } from "../utils";

describe("POST /users", () => {
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
    it("should return 201 status code", async () => {
      const tenant = await createTenant(connection.getRepository(Tenant));

      const adminToken = jwks.token({
        sub: "1",
        role: ROLES.ADMIN,
      });

      const userData = {
        firstName: "Mohit",
        lastName: "Gupta",
        email: "mohit@mern.space",
        password: "password",
        tenantId: tenant.id,
        role: ROLES.MANAGER,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(userData);

      expect(response.statusCode).toBe(201);
    });

    it("should persist user in the database", async () => {
      const tenant = await createTenant(connection.getRepository(Tenant));

      const adminToken = jwks.token({
        sub: "1",
        role: ROLES.ADMIN,
      });

      const userData = {
        firstName: "Mohit",
        lastName: "Gupta",
        email: "mohit@mern.space",
        password: "password",
        tenantId: tenant.id,
        role: ROLES.MANAGER,
      };

      await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users).toHaveLength(1);
      expect(users[0].email).toBe(userData.email);
    });

    it("should create a manager user", async () => {
      const tenant = await createTenant(connection.getRepository(Tenant));

      const adminToken = jwks.token({
        sub: "1",
        role: ROLES.ADMIN,
      });

      const userData = {
        firstName: "Mohit",
        lastName: "Gupta",
        email: "mohit@mern.space",
        password: "password",
        tenantId: tenant.id,
        role: ROLES.MANAGER,
      };

      await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users).toHaveLength(1);
      expect(users[0].role).toBe(ROLES.MANAGER);
    });

    it("should return 403 if non admin user tries to create a user", async () => {
      // Create tenant first
      const tenant = await createTenant(connection.getRepository(Tenant));

      const nonAdminToken = jwks.token({
        sub: "1",
        role: ROLES.MANAGER,
      });

      const userData = {
        firstName: "Mohit",
        lastName: "Gupta",
        email: "mohit@mern.space",
        password: "password",
        tenantId: tenant.id,
        role: ROLES.MANAGER,
      };

      // Add token to cookie
      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${nonAdminToken}`])
        .send(userData);

      expect(response.statusCode).toBe(403);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users).toHaveLength(0);
    });
  });
});
