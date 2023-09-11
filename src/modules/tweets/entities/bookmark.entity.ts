import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tweet } from "./tweet.entity";
import { User } from "@/modules/users/entities/user.entity";

@Entity('bookmarks')
export class Bookmark {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tweet, (tweet) => tweet.id, { onDelete: "CASCADE" })
  tweet: Tweet;

  @ManyToOne(() => User, (user) => user.id)
  user: User;
}