import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "@/modules/users/entities/user.entity";
import { Like } from "@/modules/likes/entities/like.entity";
import { Media } from "@/modules/media/entities/media.entity";

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

  @Column({ type: 'integer', default: 0})
  views_count: number;
  
  @OneToMany(() => Like, (like) => like.tweet, { cascade: true })
  likes: Like[];
  
  @OneToMany(() => Media, (media) => media.tweet, { cascade: true })
  media: Media[];
  
  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @ManyToOne(() => Tweet, (tweet) => tweet.id, { onDelete: "CASCADE", cascade: true }) 
  @JoinColumn()
  parent_tweet: Tweet;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
