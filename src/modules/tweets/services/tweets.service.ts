import { BadRequestException, Inject, Injectable, InternalServerErrorException, OnModuleDestroy } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, IsNull, Repository } from "typeorm";
import { Subject } from "rxjs";
import { Notification } from "@/modules/notifications/notification.entity";
import { User } from "@/modules/users/entities/user.entity";
import { UsersService } from "@/modules/users/services/users.service";
import { StorageService } from "@/modules/media/services/storage.service";
import { NotificationTypes } from "@/modules/notifications/notification.types";
import { TweetReplySubject } from "@/modules/notifications/notification_events.types";
import { MediaTypes } from "@/modules/media/constants";
import { Tweet } from "../entities/tweet.entity";
import { CreateTweetDto } from "../dto/createTweet.dto";
import { TWEET_PAGINATION_TAKE, tweetPropertiesSelect } from "../constants";
import { 
  messageParentTweetDoesNotExist, 
  messageTweetCouldNotBeCreated, 
  messageTweetNotFound, 
  messageUserNotFound 
} from "@/utils/global.constants";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { IPaginatedTweets } from "../interfaces/paginateTweets.interface";
import { ITweetResponse } from "../interfaces/TweetResponse.interface";

@Injectable()
export class TweetsService implements OnModuleDestroy{
  @InjectRepository(Tweet)
  private readonly tweetsRepository: Repository<Tweet>;

  @InjectRepository(Notification)
  private readonly notificationsRepository: Repository<Notification>;

  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
    private readonly dataSource: DataSource,   
    private readonly eventEmitter: EventEmitter2
  ) {}
  
  private readonly tweetRepliesSubject$ = new Subject<TweetReplySubject>()

  async createTweet(
    authUser: User, 
    body: CreateTweetDto, 
    files: Array<Express.Multer.File>,
    media_type = MediaTypes.IMAGE
  ): Promise<{ tweet: Tweet, successMessage: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    
    try {
      let parent_tweet: Tweet | null | undefined = undefined;

      if (body.parent_id) {
        parent_tweet = await this.tweetsRepository
          .createQueryBuilder('tweet')
          .leftJoinAndSelect('tweet.user', 'user')
          .where('tweet.id = :parent_id', { parent_id: parseInt(body.parent_id) })
          .select(['user.id', 'tweet'])
          .getOne();

        if (!parent_tweet) throw new BadRequestException(messageParentTweetDoesNotExist);

        parent_tweet.replies_count += 1;
        await queryRunner.manager.save(parent_tweet);
      } 
      
      const tweet = this.tweetsRepository.create({
        ...body,
        user: authUser,
        parent_tweet
      });
      await queryRunner.manager.save(tweet);
      
      const media = files?.length > 0
        ? await this.storageService.uploadFilesToS3Bucket(files, authUser, tweet.id, media_type, queryRunner)
        : [];

      await queryRunner.commitTransaction();

      if (body.parent_id && parent_tweet) {
        const eventPayload = { 
          event: NotificationTypes.REPLY, 
          authUserId: authUser.id,
          eventTargetUserId: parent_tweet.user.id 
        } // should include prob the tweeet message too or something // cant spam with replies so may not need caching
        
        const newNotification = this.notificationsRepository.create({
          type: NotificationTypes.REPLY,
          text: body.text_body,
          user: { id: parent_tweet.user.id }   // should be to the target user ??? or should have a to and from in db ???
        });

        this.eventEmitter.emit('new.notification', { 
          eventPayload, 
          subject$: this.tweetRepliesSubject$, 
          repository: this.notificationsRepository, 
          entity: newNotification 
        });
      }

      return {
        tweet: { ...tweet, media },
        successMessage: "Your tweet was sent",
      }
    } catch(err) {
      await queryRunner.rollbackTransaction()
      throw new InternalServerErrorException(messageTweetCouldNotBeCreated);
    } finally {
      await queryRunner.release();
    }
  }

  async getFeedTweets(authUser: User, offset = 0, take = TWEET_PAGINATION_TAKE): Promise<IPaginatedTweets> {
     //if(followingList.length > 0) go ahead and show those otherwise fetch top tweets
    const followingListTweets = await this.tweetsRepository
      .createQueryBuilder("tweet")
      .leftJoinAndSelect('tweet.likes', 'likes')
      .leftJoin('likes.user', 'user_likes')
      .leftJoinAndSelect('tweet.media', 'media')
      .innerJoinAndSelect("tweet.user", "user")
      .innerJoin("user.followed", "followed")
      .where("followed.id = :id", { id: authUser.id })
      .andWhere("tweet.parent_tweet IS NULL")
      .addSelect(['user_likes.id'])
      .skip(offset)
      .take(take + 1)
      // .orderBy('RANDOM()')
      .orderBy('tweet.created_at', 'DESC')
      .getMany()

    const hasMore = followingListTweets.length > take;
    if (hasMore) followingListTweets.splice(-1); 
   
    const addTweetsMetadata = this._setTweetsMetadata(followingListTweets, authUser.id);

    return {
      tweets: addTweetsMetadata,
      hasMore,
    }
  }

  async getUserTweets(targetUserId: number, offset = 0, take = TWEET_PAGINATION_TAKE): Promise<IPaginatedTweets> {
    const user = await this.usersService.findUser(targetUserId); 
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
    if (hasMore) tweets.splice(-1); 

    const modifiedTweets = this._setTweetsMetadata(tweets, targetUserId);

    return {
      tweets: modifiedTweets, 
      hasMore
    }
  }

  async getTweet(targetUserId: number, tweetId: number, take = TWEET_PAGINATION_TAKE): Promise<ITweetResponse> {
    const user = await this.usersService.findUser(targetUserId);
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
      if (tweet.likes[i].user.id === targetUserId) {
        tweet['liked'] = true;
        tweet['likeId'] = tweet.likes[i].id;
      }
    }

    const tweets = await this.getTweetReplies(targetUserId, tweet.id, 0, take);
    const hasMore = tweets.length > take;

    return {
      parentTweet: this._setTweetsMetadata([tweet], targetUserId)[0],
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

    const hasMore = tweets.length > take;
    if (hasMore) tweets.splice(-1); 

    return this._setTweetsMetadata(tweets, userId);
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

  tweetsRepliesObservable() {
    return this.tweetRepliesSubject$.asObservable();
  }

  onModuleDestroy() {
    this.tweetRepliesSubject$.complete();
  }
}