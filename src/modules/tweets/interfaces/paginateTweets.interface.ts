import { Tweet } from "../entities/tweet.entity";

export interface IPaginatedTweets { 
  tweets: Array<Tweet>;
  hasMore: boolean;
} 