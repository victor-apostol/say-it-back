import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { IORedisKey } from "../redis/redis.types";
import { Redis } from "ioredis";
import { Subject } from "rxjs";
import { TweetLikeEvent, TweetReplySubject } from "./notification_events.types";
import { Repository } from "typeorm";
import { Like } from "../likes/entities/like.entity";
import { Tweet } from "../tweets/entities/tweet.entity";
import { User } from "../users/entities/user.entity";

@Injectable()
export class NotificationsEventsService {
  @Inject(IORedisKey)
  private readonly redisClient: Redis;

  @OnEvent('new.notification')
  async newNotification(
    payload: {
      eventPayload: TweetLikeEvent | TweetReplySubject | TweetLikeEvent, 
      subject$: Subject<TweetLikeEvent | TweetReplySubject | TweetLikeEvent>,
      repository: Repository<Like | Tweet | User>,
      entity: Like | Tweet | User
    }
  ) {
    const { eventPayload, subject$, repository, entity } = payload;

    const stringifiedPayload = JSON.stringify(eventPayload);

    const isCached = await this.redisClient.get(stringifiedPayload);
    if (!isCached) {
      await repository.save(entity);

      subject$.next(eventPayload);

      await this.redisClient.set(stringifiedPayload, '1');
    }
  }
}