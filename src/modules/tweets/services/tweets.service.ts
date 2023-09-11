import { 
  BadRequestException, 
  Injectable, 
  InternalServerErrorException, 
  OnModuleDestroy 
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DataSource, IsNull, Repository } from "typeorm";
import { Subject } from "rxjs";
import { Notification } from "@/modules/notifications/notification.entity";
import { User } from "@/modules/users/entities/user.entity";
import { Tweet } from "../entities/tweet.entity";
import { Bookmark } from "../entities/bookmark.entity";
import { Media } from "@/modules/media/entities/media.entity";
import { TweetsViews } from "../entities/tweetsViews.entity";
import { UsersService } from "@/modules/users/services/users.service";
import { MediaService } from "@/modules/media/services/media.service";
import { StorageService } from "@/modules/media/services/storage.service";
import { CreateTweetDto } from "../dto/createTweet.dto";
import { NOTIFICATION_TYPES } from "@/modules/notifications/types/notification.types";
import { TweetReplySubject, TweetViewSubject } from "@/modules/notifications/types/notification_events.types";
import { IPaginatedTweets } from "../interfaces/paginateTweets.interface";
import { ITweetResponse } from "../interfaces/TweetResponse.interface";
import { MEDIA_TYPES_SIZES } from "@/modules/media/constants";
import { TWEET_PAGINATION_TAKE, tweetPropertiesSelect } from "../constants";
import { 
  messageBookmarkNotFoundOrYourNotTheOwner,
  messageCouldNotDeleteBookmarks,
  messageParentTweetDoesNotExist, 
  messageTweetCouldNotBeCreated, 
  messageTweetIsAlreadyBookmarked, 
  messageTweetNotFound, 
  messageTweetNotFoundOrYourNotTheOwner, 
  messageUserNotFound 
} from "@/utils/global.constants";

@Injectable()
export class TweetsService implements OnModuleDestroy{
  @InjectRepository(Tweet)
  private readonly tweetsRepository: Repository<Tweet>;

  @InjectRepository(Notification)
  private readonly notificationsRepository: Repository<Notification>;

  @InjectRepository(TweetsViews)
  private readonly tweetsViewsRepository: Repository<TweetsViews>;

  @InjectRepository(Bookmark)
  private readonly bookmarksRepository: Repository<Bookmark>;

  constructor(
    private readonly usersService: UsersService,
    private readonly mediaService: MediaService,
    private readonly storageService: StorageService,
    private readonly dataSource: DataSource,   
    private readonly eventEmitter: EventEmitter2
  ) {}
  
  private readonly tweetRepliesSubject$ = new Subject<TweetReplySubject>();
  private readonly tweetViewsSubject$ = new Subject<TweetViewSubject>();

  async createTweet(
    authUser: User, 
    body: CreateTweetDto, 
    files: Array<Express.Multer.File>,
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
          .select(['user.id', 'user.notifications_count', 'user.username', 'tweet'])
          .getOne();

        if (!parent_tweet) throw new BadRequestException(messageParentTweetDoesNotExist);

        parent_tweet.user.notifications_count += 1;
        parent_tweet.replies_count += 1;

        await queryRunner.manager.save(Tweet, parent_tweet);
        await queryRunner.manager.save(User, parent_tweet.user);
      } 
      
      const tweet = this.tweetsRepository.create({
        ...body,
        user: authUser,
        parent_tweet
      });

      await queryRunner.manager.save(Tweet, tweet);
      
      const media = [] as Array<Media>; 
      
      if (files?.length > 0) {
        await Promise.all(
          files.map(async (file) => {
            const uploadFileInfo = this.storageService.getUploadFileInfo(file);

            const mediaEntity = await this.mediaService.createTweetMedia(
              uploadFileInfo.filename, 
              authUser, 
              tweet.id, 
              uploadFileInfo.mediaType, 
              queryRunner
            );

            await this.storageService.uploadFileToS3Bucket(file, uploadFileInfo, MEDIA_TYPES_SIZES.MEDIA);

            media.push(mediaEntity);
          })
        )
      }

      await queryRunner.commitTransaction();
    
      if (body.parent_id && parent_tweet && parent_tweet.user.username !== authUser.username) {
        const eventPayload: TweetReplySubject = { 
          event: NOTIFICATION_TYPES.REPLY, 
          authUserUsername: authUser.username,
          eventTargetUsername: parent_tweet.user.username,
          tweetId: parent_tweet.id 
        } 
        
        const newNotification = this.notificationsRepository.create({
          type: NOTIFICATION_TYPES.REPLY,
          text: body.text_body,
          action_user: { id: authUser.id },
          target_user: { id: parent_tweet.user.id },
          tweet: { id: parent_tweet.id }
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
      .leftJoinAndSelect('tweet.bookmarks', 'bookmarks')
      .leftJoin('bookmarks.user', 'user_bookmarks')
      .leftJoin('likes.user', 'user_likes')
      .leftJoinAndSelect('tweet.media', 'media')
      .innerJoinAndSelect("tweet.user", "user")
      .innerJoin("user.followed", "followed")
      .where("followed.id = :id", { id: authUser.id })
      .andWhere("tweet.parent_tweet IS NULL")
      .addSelect(['user_likes.id', 'user_likes.username', 'user_bookmarks.id', 'user_bookmarks.username'])
      .skip(offset)
      .take(take + 1)
      .orderBy('tweet.created_at', 'DESC')
      .getMany()

    const hasMore = followingListTweets.length > take;
    if (hasMore) followingListTweets.splice(-1); 

    const addTweetsMetadata = this._setTweetsMetadata(followingListTweets, authUser.username);

    return {
      tweets: addTweetsMetadata,
      hasMore,
    }
  }

  async getUserTweets(targetUsername: string, offset = 0, take = TWEET_PAGINATION_TAKE): Promise<IPaginatedTweets> {
    const user = await this.usersService.findUser(targetUsername); 
    if (!user) throw new BadRequestException(messageUserNotFound);

    const tweets = await this.tweetsRepository.find({
      where: {
        user: { id: user.id }, 
        parent_tweet: IsNull()       
      },
      relations: ['media', 'user', 'likes', 'likes.user', 'bookmarks', 'bookmarks.user'],
      ...tweetPropertiesSelect,
      skip: offset,
      take: take + 1,
      order: {
        created_at: 'DESC'
      }
    });

    const hasMore = tweets.length > take;
    if (hasMore) tweets.splice(-1); 

    const modifiedTweets = this._setTweetsMetadata(tweets, targetUsername);

    return {
      tweets: modifiedTweets, 
      hasMore
    }
  }

  async getTweet(authUser: User, targetUsername: string, tweetId: number, take = TWEET_PAGINATION_TAKE): Promise<ITweetResponse> {
    const user = await this.usersService.findUser(targetUsername);
    if(!user) throw new BadRequestException(messageUserNotFound);

    const tweet = await this.tweetsRepository.findOne({ 
      where: { 
        id: tweetId 
      }, 
      relations: ['media', 'user.followed', 'likes', 'likes.user', 'bookmarks', 'bookmarks.user'],
      ...tweetPropertiesSelect,
    });
    
    if (!tweet) throw new BadRequestException(messageTweetNotFound);

    const amIfollowingTweetOwner = tweet.user.followed.some(user => user.username === authUser.username);
    tweet["amIfollowingTweetOwner"] = amIfollowingTweetOwner;

    const tweets = await this.getTweetReplies(targetUsername, tweet.id, 0, take);
    const hasMore = tweets.length > take;

    return {
      parentTweet: this._setTweetsMetadata([tweet], targetUsername)[0],
      tweets,
      hasMore
    }
  } 

  async getTweetReplies(username: string, tweetId: number, offset = 1, take = TWEET_PAGINATION_TAKE) {
    const tweets = await this.tweetsRepository.find({
      where: {
        parent_tweet: { id: tweetId } 
      },
      relations: ['media', 'user', 'likes', 'likes.user', 'bookmarks', 'bookmarks.user'],
      ...tweetPropertiesSelect,
      skip: offset,
      take: take + 1,
      order: {
        created_at: 'DESC'
      }
    });

    const hasMore = tweets.length > take;
    if (hasMore) tweets.splice(-1); 

    return this._setTweetsMetadata(tweets, username);
  }

  async viewTweet(authUser: User, tweetId: number): Promise<void> {
    const tweet = await this.tweetsRepository.findOne({ 
      where: {
        id: tweetId 
      },
      relations: { user: true },
      select: {
        id: true,
        user: {
          id: true,
          username: true
        }
      }
    });

    if (!tweet) throw new BadRequestException(messageTweetNotFound);

    const findView = await this.tweetsViewsRepository.findOne({
      where: {
        user: { id: authUser.id },
        tweet: { id: tweet.id }
      },
    });

    if (findView) return;

    const queryRunner = this.dataSource.createQueryRunner(); 

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // could cache event in redis and check there, if is then i dont do anything otherwise i add + 1 without creating another row
      // could just add another column specifing how many views did this user add to the tweet in tweets_views 
      const newView = queryRunner.manager.create(TweetsViews, {
        user: { id: authUser.id },
        tweet: { id: tweet.id }
      });

      tweet.views_count += 1;

      await queryRunner.manager.save(TweetsViews, newView);
      await queryRunner.manager.save(Tweet, tweet);

      await queryRunner.commitTransaction();

      const eventPayload: TweetViewSubject = { 
        event: NOTIFICATION_TYPES.VIEW, 
        authUserUsername: authUser.username,
        eventTargetUsername: tweet.user.username,
        tweetId 
      } 

      this.eventEmitter.emit('new.notification', { 
        eventPayload, 
        subject$: this.tweetViewsSubject$, 
        repository: this.tweetsViewsRepository, 
        entity: newView 
      });
    } catch(err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err?.message);
    } finally {
      await queryRunner.release();
    }
  }
  
  async deleteTweet(authUser: User, tweetId: number): Promise<void> {
    const result = await this.tweetsRepository.delete({
      id: tweetId,
      user: { id: authUser.id }
    });

    if (result.affected == 0) throw new BadRequestException(messageTweetNotFoundOrYourNotTheOwner);
  }

  async getBookmarks(authUser: User, offset = 0, take = 50): Promise<{tweets: Array<Tweet>, hasMore: boolean}> {
    const bookmarks = await this.bookmarksRepository.find({
      where: { 
        user: { id: authUser.id }
      },
      relations: ['tweet', 'tweet.media', 'tweet.user', 'tweet.likes', 'tweet.likes.user', 'tweet.bookmarks', 'tweet.bookmarks.user'],
      take: take + 1,
      skip: offset
    });
    
    const hasMore = bookmarks.length > take;
    if (hasMore) bookmarks.splice(-1);

    const tweets = bookmarks.map(bookmark => {
      return this._setTweetsMetadata([bookmark.tweet], authUser.username)[0];
    });

    return {
      tweets: tweets,
      hasMore
    }
  }

  async addBookmark(authUser: User, tweetId: number): Promise<Bookmark> {
    const queryRunner = this.dataSource.createQueryRunner(); 

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tweet = await queryRunner.manager.findOne(Tweet, {
        where: { id: tweetId },
        select: ['id', 'bookmarks_count']
      });

      if (!tweet) throw new BadRequestException(messageTweetNotFound);

      const bookmark = await queryRunner.manager.findOne(Bookmark, {
        where: { 
          tweet: { id: tweet.id },
          user: { id: authUser.id }
        }
      });

      if (bookmark) throw new BadRequestException(messageTweetIsAlreadyBookmarked);

      let newBookmark = queryRunner.manager.create(Bookmark, {
        user: { id: authUser.id },
        tweet: { id: tweet.id }
      });

      tweet.bookmarks_count = tweet.bookmarks_count + 1;

      await queryRunner.manager.save(Tweet, tweet);
      newBookmark = await queryRunner.manager.save(Bookmark, newBookmark);

      await queryRunner.commitTransaction();

      return newBookmark;
    } catch(err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err?.message);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteBookmark(authUser: User, bookmarkId: number): Promise<void> {
    const bookmark = await this.bookmarksRepository.delete(
      {
        user: { id: authUser.id },
        id: bookmarkId
      }, 
    );

    if (bookmark.affected == 0) throw new BadRequestException(messageBookmarkNotFoundOrYourNotTheOwner);
  }

  async deleteAllBookmarks(authUser: User): Promise<void> {
    const deleteResult = await this.bookmarksRepository.delete({ user: { id: authUser.id }});

    if (deleteResult.affected == 0) throw new BadRequestException(messageCouldNotDeleteBookmarks);
  }

  _setTweetsMetadata(tweets: Array<Tweet>, username: string) {
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
      tweet['bookmarked'] = false;

      for (let i = 0; i < tweet.likes.length; i++) {
        if (tweet.likes[i].user.username === username) {
          tweet['liked'] = true;
          tweet['likeId'] = tweet.likes[i].id;
        }
      }

      for (let i = 0; i < tweet.bookmarks.length; i++) {
        if (tweet.bookmarks[i].user.username === username) {
          tweet['bookmarked'] = true;
          tweet['bookmarkId'] = tweet.bookmarks[i].id;
        }
      }

      return tweet;
    });
  }

  tweetsRepliesObservable() {
    return this.tweetRepliesSubject$.asObservable();
  }

  tweetsViewsObservable() {
    return this.tweetViewsSubject$.asObservable();
  }

  onModuleDestroy() {
    this.tweetRepliesSubject$.complete();
  }
}