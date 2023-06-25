import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
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

  @OneToMany(() => Like, (like) => like.tweet)
  likes: Like[];

  @OneToMany(() => Media, (media) => media.tweet)
  media: Media[];

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  // views 
}
