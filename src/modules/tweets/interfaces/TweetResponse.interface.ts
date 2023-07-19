import { Tweet } from "../entities/tweet.entity";

export interface ITweetResponse {
  parentTweet: Tweet;
  tweets: Array<Tweet>;
  requestId: string;
  hasMore: boolean;
}