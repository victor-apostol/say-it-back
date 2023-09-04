import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { User } from "@/modules/users/entities/user.entity";

@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tweet, (tweet) => tweet.likes, { onDelete: "CASCADE" })
  tweet: Tweet;

  @ManyToOne(() => User, (user) => user.id) 
  user: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

