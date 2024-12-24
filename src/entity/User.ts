import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn() // Auto-increment id
  id: number; // Unique id
}
