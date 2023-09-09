import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "@/modules/users/entities/user.entity";
import { Tweet } from "./tweet.entity";

@Entity('tweets_views')
export class TweetsViews {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.id, { nullable: false })
  user: User;

  @ManyToOne(() => Tweet, tweet => tweet.id, { onDelete: "CASCADE", nullable: false })
  tweet: Tweet;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}