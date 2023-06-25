import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { User } from "@/modules/users/entities/user.entity";
import { Comment } from "@/modules/comments/entitites/comment.entity";
import { TargetsTypes } from "@/utils/global.constants";

@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: TargetsTypes })
  target: TargetsTypes;

  @ManyToOne(() => Tweet, (tweet) => tweet.likes)
  tweet: Tweet;

  @ManyToOne(() => Comment, (comment) => comment.likes)
  comment: Comment;

  @ManyToOne(() => User, (user) => user.id) 
  user: User;
}

