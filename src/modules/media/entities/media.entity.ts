import { AfterLoad, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tweet } from "src/modules/tweets/entities/tweet.entity";
import { User } from "src/modules/users/entities/user.entity";
import { MEDIA_TYPES } from "@/modules/media/constants";

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  path: string;

  @Column({ type: 'enum', enum: MEDIA_TYPES })
  media_type: MEDIA_TYPES;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @ManyToOne(() => Tweet, (tweet) => tweet.id)
  tweet: Tweet;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @AfterLoad()
  appendS3BucketName() {
    this.path = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${this.path}`;
  }
}