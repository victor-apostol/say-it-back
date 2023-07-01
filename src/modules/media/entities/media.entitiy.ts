import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tweet } from "src/modules/tweets/entities/tweet.entity";
import { User } from "src/modules/users/entities/user.entity";
import { MediaTypes } from "@/modules/media/constants";

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  path: string;

  @Column({ type: 'enum', enum: MediaTypes })
  media_type: MediaTypes;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @ManyToOne(() => Tweet, (tweet) => tweet.id)
  tweet: Tweet;
}