import { AfterRemove, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { User } from "@/modules/users/entities/user.entity";

@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tweet, (tweet) => tweet.likes)
  tweet: Tweet;

  @ManyToOne(() => User, (user) => user.id) 
  user: User;

  @AfterRemove()
  async updateTweetLikesCount() {
    if (this.tweet) {
      console.log("AFTER REMOVE")
      console.log(this.tweet)
      // this.tweet.likes_count -= 1;
      // await this.tweet.save();
    }
  }
}

