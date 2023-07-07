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
  ): Promise<Tweet> {
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
      } 

      const tweet = this.tweetsRepository.create({
        ...body,
        user,
        media: [],
        parent_tweet
      });
      await queryRunner.manager.save(tweet);
      
      if (files?.length > 0) await this.storageService.uploadFileToS3Bucket(files, authUser.id, tweet.id, media_type, queryRunner); 
      
      await queryRunner.commitTransaction();

      return tweet;
    } catch(err) {
      await queryRunner.rollbackTransaction()
      throw new InternalServerErrorException(messageTweetCouldNotBeCreated);
    } finally {
      await queryRunner.release();
    }
  }

  async getUserTweets(userId: number, offset = 0, count = 5): Promise<IPaginatedTweets> {
    const user = await this.usersService.findUser(userId); 
    if (!user) throw new BadRequestException(messageUserNotFound);

    const tweets = await this.tweetsRepository.find({
      where: {
        user: { id: user.id }, 
        parent_tweet: IsNull()       
      },
      relations: ['media', 'user', 'likes', 'likes.user'],
      select: { 
        user: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          avatar: true,
        },
        likes: {
          id: true,
          user: {
            id: true,
          }
        }
      },
      skip: offset,
      take: count + 1,
      order: {
        id: 'DESC'
      }
    });

    const hasMore = tweets.length > count;
    const modifiedTweets = this._setTweetMetadata(tweets, userId);

    return {
      tweets: modifiedTweets.slice(0, count), 
      hasMore
    }
  }

  async getTweet(userId: number, tweetId: number, count = 5): Promise<ITweetResponse> {
    const user = await this.usersService.findUser(userId);
    if(!user) throw new BadRequestException(messageUserNotFound);

    const tweet = await this.tweetsRepository.findOne({ 
      where: { 
        id: tweetId 
      }, 
      relations: ['media', 'user', 'likes', 'likes.user'],
      select: { 
        user: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          avatar: true,
        },
        likes: {
          id: true,
          user: {
            id: true,
          }
        }
      },
    });

    if (!tweet) throw new BadRequestException(messageTweetNotFound);

    for (let i = 0; i < tweet.likes.length; i++) {
      if (tweet.likes[i].user.id === userId) {
        tweet['liked'] = true;
        tweet['likeId'] = tweet.likes[i].id;
      }
    }

    const tweets = await this.getTweetReplies(userId, tweet.id, 0, count);

    const hasMore = tweets.length > count;

    return {
      parentTweet: tweet,
      tweets: tweets.slice(0, count),
      hasMore
    }
  } 

  async getTweetReplies(userId: number, tweetId: number, offset = 1, count = 5) {
    const tweets = await this.tweetsRepository.find({
      where: {
        parent_tweet: { id: tweetId } 
      },
      relations: ['media', 'user', 'likes', 'likes.user'],
      select: { 
        user: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          avatar: true,
        },
        likes: {
          id: true,
          user: {
            id: true,
          }
        }
      },
      skip: offset,
      take: count + 1,
      order: {
        id: 'DESC'
      }
    });

    const modifiedTweets = this._setTweetMetadata(tweets, userId);
    return modifiedTweets;
  }

  _setTweetMetadata(tweets: Array<Tweet>, userId: number) {
    const timestamp = new Date().getTime();

    return tweets.map(tweet => {
      const diffInMilliseconds = timestamp - new Date(tweet.created_at).getTime();

      diffInMilliseconds < 60000
        ? tweet['timestamp_diff'] = Math.floor(diffInMilliseconds / 1000) + 's'
        : diffInMilliseconds < 3600000
          ? tweet['timestamp_diff'] = Math.floor(diffInMilliseconds / 60000) + 'm'
          : tweet['timestamp_diff'] = Math.floor(diffInMilliseconds / 3600000) + 'h';
      
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