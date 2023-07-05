import { Tweet } from "../entities/tweet.entity";

export interface ITweetResponse {
  tweet: Tweet, 
  replies: Array<Tweet>
}