import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entity/User";
import { Config } from ".";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: Config.DB_HOST,
  port: Number(Config.DB_PORT),
  username: Config.DB_USERNAME,
  password: Config.DB_PASSWORD,
  database: Config.DB_NAME,
  // Don't use synchronize in production - otherwise you may lose data
  // Always keep synchronize: false in production
  synchronize: false,
  logging: false,
  entities: [User],
  migrations: [],
  subscribers: [],
});
