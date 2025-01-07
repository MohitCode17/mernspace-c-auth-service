import { DataSource, Repository } from "typeorm";
import { Tenant } from "../../src/entity/Tenant";

export const truncateTables = async (connection: DataSource) => {
  const entities = connection.entityMetadatas; // All entities in the database

  // Loop through all entities and truncate them
  for (const entity of entities) {
    // Get the repository for the entity
    const repository = connection.getRepository(entity.name);

    // Clear the table
    await repository.clear();
  }
};

export const isJwt = (token: string | null): boolean => {
  if (token === null) {
    return false;
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  try {
    parts.forEach((part) => {
      Buffer.from(part, "base64").toString("utf-8");
    });
    return true;
  } catch {
    return false;
  }
};

export const createTenant = async (repository: Repository<Tenant>) => {
  const tenant = await repository.save({
    name: "Test tenant",
    address: "Test address",
  });

  return tenant;
};
