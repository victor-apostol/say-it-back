import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "@/modules/users/entities/user.entity";
import { Like } from "@/modules/likes/entities/like.entity";
import { Media } from "@/modules/media/entities/media.entitiy";

@Entity('tweets')
export class Tweet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 1001 })
  text_body: string;

  @Column({ type: 'integer', default: 0 })
  likes_count: number;

  @Column({ type: 'integer', default: 0 })
  replies_count: number;

  @ManyToOne(() => Tweet, (tweet) => tweet.id)
  @JoinColumn()
  parent_tweet: Tweet;

  @OneToMany(() => Like, (like) => like.tweet)
  likes: Like[];

  @OneToMany(() => Media, (media) => media.tweet)
  media: Media[];

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
  // views 
}
