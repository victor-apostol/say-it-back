import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { IJwtPayload } from "@/modules/auth/interfaces/jwt.interface";
import { CreateLikeDto } from "@/modules/likes/dto/create.dto";
import { Like } from "@/modules/likes/entities/like.entity";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { messageTweetNotFound, messageUserNotFound } from "@/utils/global.constants";
import { messageTweetIsAlreadyLiked } from "../constants";
import { NotificationTypes } from "@/modules/notifications/notification.types";
import { IORedisKey } from "@/modules/redis/redis.types";
import Redis from "ioredis";
import { Subject } from "rxjs";
import { TweetLikeEvent } from "@/modules/notifications/notification_events.types";

@Injectable()
export class LikesService {
  @InjectRepository(Tweet)
  private readonly tweetRepository: Repository<Tweet>;

  @InjectRepository(Like)
  private readonly likeRepository: Repository<Like>;

  @Inject(IORedisKey)
  private readonly redisClient: Redis;

  constructor(private readonly dataSource: DataSource) {}
  
  private readonly likesSubject$ = new Subject<TweetLikeEvent>();

  async createLike(authUser: IJwtPayload, body: CreateLikeDto): Promise<any | BadRequestException> { 
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tweet = await this.tweetRepository.findOne({ 
        where: {
          id: body.tweetId 
        },
        relations: { user: true },
        select: {
          user: {
            id: true
          }
        }
      });
      if (!tweet) throw new BadRequestException(messageTweetNotFound);
  
      const isTweetLiked = await this.likeRepository.findOne({ 
        where: {  
          user: authUser,
          tweet: { id: tweet.id }          
        }
      });
  
      if (isTweetLiked) throw new BadRequestException(messageTweetIsAlreadyLiked);
  
      const likeObject = queryRunner.manager.create(Like, {
        user: authUser,
        tweet
      });
    
      tweet.likes_count = tweet.likes_count + 1; // likign replies doesnt send eventshaha neither the original tweet

      const like = await queryRunner.manager.save(likeObject);
      await queryRunner.manager.save(tweet);
      console.log("COMMITING", tweet.user.id)
      await queryRunner.commitTransaction(); 

      const eventPayload = { 
        event: NotificationTypes.LIKE, 
        likeId: like.id,
        authUserId: authUser.id, 
        eventTargetUserId: tweet.user.id 
      }

      const stringifiedPayload = JSON.stringify(eventPayload);

      const isCached = await this.redisClient.get(stringifiedPayload);
      console.log(isCached)
      if (!isCached) {
        console.log("SENDING EVENT")
        // write event to DB
        this.likesSubject$.next(eventPayload);

        await this.redisClient.set(stringifiedPayload, '1');
      }

      return { ...tweet, likeId: like.id }
    } catch(err) {
      console.log("ERROR", err)
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err?.message);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteLike(authUser: IJwtPayload, likeId: number, tweetId: number): Promise<{ success: boolean }> {
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