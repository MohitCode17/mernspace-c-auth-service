import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn() // Auto-increment id
  id: number; // Unique id

  @Column() // Column in the database
  firstName: string; // First name of the user

  @Column() // Column in the database
  lastName: string; // Last name of the user

  @Column() // Column in the database
  email: string; // Email of the user

  @Column() // Column in the database
  password: string; // Password of the user
}
