import { Tweet } from "../entities/tweet.entity";

export interface ITweetResponse {
  parentTweet: Tweet;
  tweets: Array<Tweet>;
  hasMore: boolean;
}