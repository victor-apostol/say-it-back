import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Subject } from "rxjs";
import { DataSource, Repository } from "typeorm";
import { Notification } from "@/modules/notifications/notification.entity";
import { Like } from "@/modules/likes/entities/like.entity";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { CreateLikeDto } from "@/modules/likes/dto/create.dto";
import { NOTIFICATION_TYPES } from "@/modules/notifications/types/notification.types";
import { TweetLikeSubject } from "@/modules/notifications/types/notification_events.types";
import { messageTweetIsAlreadyLiked } from "../constants";
import { messageTweetNotFound } from "@/utils/global.constants";
import { User } from "@/modules/users/entities/user.entity";
import { TWEET_LIKES_PAGINATION_TAKE } from "@/modules/tweets/constants";

@Injectable()
export class LikesService {
  @InjectRepository(Tweet)
  private readonly tweetRepository: Repository<Tweet>;

  @InjectRepository(Like)
  private readonly likeRepository: Repository<Like>;

  @InjectRepository(Notification)
  private readonly notificationsRepository: Repository<Notification>;

  @InjectRepository(User)
  private readonly usersRepository: Repository<User>;

  constructor(
    private readonly dataSource: DataSource, 
    private readonly eventEmitter: EventEmitter2,
  ) {}
    
  private readonly likesSubject$ = new Subject<TweetLikeSubject | string>();

  async getTweetLikes(
    authUserId: number, 
    tweetId: number, 
    skip = 0, 
    take = TWEET_LIKES_PAGINATION_TAKE
  ): Promise<{likes: Array<Like>, hasMore: boolean}> {
    let likes = await this.likeRepository.find({
      where: {
        tweet: { id: tweetId }
      },
      relations: ['user'],
      select: {
        user: { 
          id: true, 
          username: true, 
          background: true, 
          avatar: true, 
          bio: true 
        }
      },
      skip: skip,
      take: take + 1
    });
    
    const hasMore = likes.length > take;
    if (hasMore) likes.splice(-1);

    const myFollowings = await this.usersRepository.findOne({
      where: {
        id: authUserId
      },
      relations: { following: true },
      select: { 
        following: { 
          id: true, username: true 
        }
      }
    });

    if (!myFollowings) throw new InternalServerErrorException();

    likes = likes.map(like => {
      const amIfollowingUser = myFollowings.following.some(following => like.user.username === following.username);

      like["amIfollowingUser"] = amIfollowingUser;
      return like;
    })

    return {
      likes,
      hasMore
    }
  }
  
  async createLike(authUser: User, body: CreateLikeDto): Promise<Tweet & { likeId: number }> { 
    const queryRunner = this.dataSource.createQueryRunner(); 

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const isTweetLiked = await this.likeRepository.findOne({ 
        where: {  
          user: { id: authUser.id },
          tweet: { id: body.tweetId }          
        },
        select: ['id']
      });

      if (isTweetLiked) throw new BadRequestException(messageTweetIsAlreadyLiked);

      const tweet = await this.tweetRepository.findOne({ 
        where: {
          id: body.tweetId 
        },
        relations: { user: true },
        select: {
          user: {
            id: true,
            username: true
          }
        }
      });
      if (!tweet) throw new BadRequestException(messageTweetNotFound);
      
      const likeObject = queryRunner.manager.create(Like, {
        user: authUser,
        tweet
      });
    
      tweet.likes_count = tweet.likes_count + 1; 

      const like = await queryRunner.manager.save(likeObject);
      await queryRunner.manager.save(tweet);

      await queryRunner.commitTransaction(); 

      if (authUser.username !== tweet.user.username) {
        const eventPayload: TweetLikeSubject = { 
          event: NOTIFICATION_TYPES.LIKE, 
          tweetId: tweet.id,
          authUserUsername: authUser.username, 
          eventTargetUsername: tweet.user.username 
        }

        const newNotification = this.notificationsRepository.create({
          type: NOTIFICATION_TYPES.LIKE,
          action_user: { id: authUser.id },
          target_user: { id: tweet.user.id },
          tweet: { id: tweet.id }
        });

        this.eventEmitter.emit('new.notification', { 
          eventPayload, 
          subject$: this.likesSubject$, 
          repository: this.notificationsRepository,
          entity: newNotification
        });
      }
    
      return { ...tweet, likeId: like.id }
    } catch(err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err?.message);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteLike(authUser: User, likeId: number, tweetId: number): Promise<{ success: boolean }> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tweet = await this.tweetRepository.findOneBy({ id: tweetId }); 
      if (!tweet) throw new BadRequestException(messageTweetNotFound);
      
      const result = await queryRunner.manager.delete(Like, {
        id: likeId,
        user: { 
          id: authUser.id 
        },
      });
      
      if (result.affected == 0) throw new BadRequestException('Can\'t unlike this tweet');
      
      tweet.likes_count = tweet.likes_count - 1;
      await queryRunner.manager.save(tweet);

      await queryRunner.commitTransaction();
  
      return { success: true }
    } catch(err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err?.message);
    } finally {
      await queryRunner.release();
    }
  }

  likesObservable() {
    return this.likesSubject$.asObservable();
  }

  onModuleDestroy() {
    this.likesSubject$.complete();
  }
}