import { DataSource } from "typeorm";

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
