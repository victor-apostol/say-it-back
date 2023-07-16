import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { defaultUserAvatarPath } from "@/utils/global.constants";
import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 32 })
  first_name: string;

  @Column({ type: 'varchar', length: 32 })
  last_name: string;

  @Column({ type: 'varchar', length: 128, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 128, default: defaultUserAvatarPath})
  avatar: string; 
  
  @Column({ type: 'varchar', length: 128, select: false})
  password: string;

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

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}