import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, IsNull, Repository } from "typeorm";
import { Tweet } from "../entities/tweet.entity";
import { CreateTweetDto } from "../dto/createTweet.dto";
import { UsersService } from "@/modules/users/services/users.service";
import { StorageService } from "@/modules/media/services/storage.service";
import { MediaTypes } from "@/modules/media/constants";
import { IPaginatedTweets } from "../interfaces/paginateTweets.interface";
import { IJwtPayload } from "@/modules/auth/interfaces/jwt.interface";
import { ITweetResponse } from "../interfaces/TweetResponse.interface";
import { TWEET_PAGINATION_TAKE, tweetPropertiesSelect } from "../constants";
import { 
  messageParentTweetDoesNotExist, 
  messageTweetCouldNotBeCreated, 
  messageTweetNotFound, 
  messageUserNotFound 
} from "@/utils/global.constants";

@Injectable()
export class TweetsService {
  @InjectRepository(Tweet)
  private readonly tweetsRepository: Repository<Tweet>;

  constructor(
    private readonly usersService: UsersService, 
    private readonly storageService: StorageService,
    private readonly dataSource: DataSource,   
  ) {}

  async createTweet(
    authUser: IJwtPayload, 
    body: CreateTweetDto, 
    files: Array<Express.Multer.File>,
    media_type = MediaTypes.IMAGE
  ): Promise<{ tweet: Tweet, successMessage: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    
    try {
      const user = await this.usersService.findUser(authUser.id);
      if (!user) throw new BadRequestException(messageUserNotFound);

      let parent_tweet: Tweet | null | undefined = undefined;

      if (body.parent_id) {
        parent_tweet = await this.tweetsRepository.findOneBy({ id: parseInt(body.parent_id) });
        if (!parent_tweet) throw new BadRequestException(messageParentTweetDoesNotExist);

        parent_tweet.replies_count += 1;
        await queryRunner.manager.save(parent_tweet);
      } 1111
      

      const tweet = this.tweetsRepository.create({
        ...body,
        user,
        media: [],
        parent_tweet
      });
      await queryRunner.manager.save(tweet);
      
      if (files?.length > 0) await this.storageService.uploadFileToS3Bucket(files, authUser.id, tweet.id, media_type, queryRunner); 
      
      await queryRunner.commitTransaction();

      return {
        tweet: tweet,
        successMessage: "Your tweet was sent"
      }
    } catch(err) {
      await queryRunner.rollbackTransaction()
      throw new InternalServerErrorException(messageTweetCouldNotBeCreated);
    } finally {
      await queryRunner.release();
    }
  }

  async getFeedTweets(authUser: IJwtPayload, offset = 0, take = TWEET_PAGINATION_TAKE): Promise<IPaginatedTweets> {
    const user = await this.usersService.findUser(authUser.id); 
    if (!user) throw new BadRequestException(messageUserNotFound);

    let counter = 1;
    let hasMore = true;
    const feedTweets: Array<Tweet> = []; //if(followingList.length > 0) go ahead and show those otherwise fetch top tweets
    
    const followingList = await this.usersService.getFollowingList(authUser, offset, take); 
    if (followingList.length <= take) hasMore = false; 
   
    const allTweets = followingList.flatMap((user) => user.tweets);

    while (counter <= followingList.length && counter <= take) {
      const randomIndex = Math.floor(Math.random() * allTweets.length);
      const randomTweet = allTweets[randomIndex];

      if (!feedTweets.includes(randomTweet)) feedTweets.push(randomTweet);

      counter ++;
    }
    console.log(feedTweets)
    return {
      tweets: feedTweets,
      hasMore
    }
  }

  async getUserTweets(userId: number, offset = 0, take = TWEET_PAGINATION_TAKE): Promise<IPaginatedTweets> {
    const user = await this.usersService.findUser(userId); 
    if (!user) throw new BadRequestException(messageUserNotFound);

    const tweets = await this.tweetsRepository.find({
      where: {
        user: { id: user.id }, 
        parent_tweet: IsNull()       
      },
      relations: ['media', 'user', 'likes', 'likes.user'],
      ...tweetPropertiesSelect,
      skip: offset,
      take: take + 1,
      order: {
        created_at: 'DESC'
      }
    });

    const hasMore = tweets.length > take;
    
    tweets.splice(-1);
    const modifiedTweets = this._setTweetsMetadata(tweets, userId);

    return {
      tweets: modifiedTweets, 
      hasMore
    }
  }

  async getTweet(userId: number, tweetId: number, take = TWEET_PAGINATION_TAKE): Promise<ITweetResponse> {
    const user = await this.usersService.findUser(userId);
    if(!user) throw new BadRequestException(messageUserNotFound);

    const tweet = await this.tweetsRepository.findOne({ 
      where: { 
        id: tweetId 
      }, 
      relations: ['media', 'user', 'likes', 'likes.user'],
      ...tweetPropertiesSelect,
    });

    if (!tweet) throw new BadRequestException(messageTweetNotFound);

    for (let i = 0; i < tweet.likes.length; i++) {
      if (tweet.likes[i].user.id === userId) {
        tweet['liked'] = true;
        tweet['likeId'] = tweet.likes[i].id;
      }
    }

    const tweets = await this.getTweetReplies(userId, tweet.id, 0, take);
    const hasMore = tweets.length > take;

    return {
      parentTweet: tweet,
      tweets,
      hasMore
    }
  } 

  async getTweetReplies(userId: number, tweetId: number, offset = 1, take = TWEET_PAGINATION_TAKE) {
    const tweets = await this.tweetsRepository.find({
      where: {
        parent_tweet: { id: tweetId } 
      },
      relations: ['media', 'user', 'likes', 'likes.user'],
      ...tweetPropertiesSelect,
      skip: offset,
      take: take + 1,
      order: {
        created_at: 'DESC'
      }
    });

    tweets.splice(-1);
    const modifiedTweets = this._setTweetsMetadata(tweets, userId);

    return modifiedTweets;
  }

  _setTweetsMetadata(tweets: Array<Tweet>, userId: number) {
    const timestamp = new Date().getTime();

    return tweets.map(tweet => {
      const diffInMilliseconds = timestamp - new Date(tweet.created_at).getTime();

      diffInMilliseconds < 60000
        ? tweet['timestamp_diff'] = Math.floor(diffInMilliseconds / 1000) + 's'
        : diffInMilliseconds < 3600000
          ? tweet['timestamp_diff'] = Math.floor(diffInMilliseconds / 60000) + 'm'
          : diffInMilliseconds < 86400000
            ? tweet['timestamp_diff'] = Math.floor(diffInMilliseconds / 3600000) + 'h'
            : tweet['timestamp_diff'] = Math.floor(diffInMilliseconds / 86400000) + 'd';
      
      tweet['liked'] = false;

      for (let i = 0; i < tweet.likes.length; i++) {
        if (tweet.likes[i].user.id === userId) {
          tweet['liked'] = true;
          tweet['likeId'] = tweet.likes[i].id;
        }
      }
      
      return tweet;
    });
  }
}