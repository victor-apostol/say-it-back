import { Tweet } from "src/modules/tweets/entities/tweet.entity";
import { User } from "src/modules/users/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MediaTypes } from "../constants";

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  path: string;

  @Column({ type: 'enum', enum: MediaTypes, default: MediaTypes.USER })
  media_type: MediaTypes;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @ManyToOne(() => Tweet, (tweet) => tweet.id)
  tweet: Tweet;
}