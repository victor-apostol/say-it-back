import { User } from "./../../users/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('tweets')
export class Tweet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 1001 })
  text_body: string;

  @ManyToOne(() => User, (user) => user.id)
  user: User;
}
