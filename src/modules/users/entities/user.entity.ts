import { 
  AfterLoad,
  Column, 
  Entity, 
  JoinTable, 
  ManyToMany, 
  OneToMany, 
  PrimaryGeneratedColumn 
} from "typeorm";
import { config } from "dotenv";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";

config();

const defaultBackgroundUrl = process.env.DEFAULT_BACKGROUND_IMAGE;
const defaultAvatarUrl = process.env.DEFAULT_AVATAR_IMAGE;

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 32 })
  name: string;

  @Column({ type: 'varchar', length: 16, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 120, default: "" })
  bio: string;

  @Column({ type: 'varchar', length: 128, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 128, default: defaultAvatarUrl })
  avatar: string; 

  @Column({ type: 'varchar', length: 128, default: defaultBackgroundUrl })
  background: string; 
  
  @Column({ type: 'varchar', length: 128, select: false })
  password: string;

  @Column({ type: 'boolean', default: false })
  is_oauth: boolean;

  @Column({ type: 'integer', default: 0 })
  notifications_count: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @OneToMany(() => Tweet, tweet => tweet.user)
  tweets: Array<Tweet> 

  @ManyToMany(() => User, user => user.following)
  @JoinTable({
    name: "friendships",
    joinColumn: {
      name: "followed_id",
      referencedColumnName: "id"
    },
    inverseJoinColumn: {
      name: "following_id",
      referencedColumnName: "id"
    }
  })
  followed: Array<User>;

  @ManyToMany(() => User, user => user.followed)
  following: Array<User>;

  @AfterLoad()
  appendS3BucketName() {
    const bucketName = process.env.AWS_S3_BUCKET;

    this.avatar = `https://${bucketName}.s3.amazonaws.com/${this.avatar}`;
    this.background = `https://${bucketName}.s3.amazonaws.com/${this.background}`;
    // handle the google avatar images, they have full URL, maybe download them and upload to S3;
  }
}