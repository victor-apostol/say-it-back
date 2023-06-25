import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Like } from "@/modules/likes/entities/like.entity";
import { Media } from "@/modules/media/entities/media.entitiy";

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', default: 0 })
  likes_count: number;

  @Column({ type: 'varchar', length: 1001 })
  text_body: string;

  @OneToMany(() => Like, (like) => like.comment)
  likes: Like[];

  @OneToMany(() => Media, (media) => media.comment) 
  media: Media[];
}