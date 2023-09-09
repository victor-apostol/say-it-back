import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { IORedisKey } from "../redis/redis.types";
import { Redis } from "ioredis";
import { Subject } from "rxjs";
import { FollowNotificationSubject, TweetLikeSubject, TweetReplySubject, TweetViewSubject } from "./types/notification_events.types";
import { Repository } from "typeorm";
import { Like } from "../likes/entities/like.entity";
import { Tweet } from "../tweets/entities/tweet.entity";
import { User } from "../users/entities/user.entity";
import { NOTIFICATION_TYPES } from "./types/notification.types";

type ListenerPayload = {
  eventPayload: Exclude<TweetLikeSubject | TweetReplySubject | FollowNotificationSubject | TweetViewSubject, string>, 
  subject$: Subject<TweetLikeSubject | TweetReplySubject | TweetViewSubject | FollowNotificationSubject>,
  repository: Repository<Like | Tweet | User>,
  entity: Like | Tweet | User 
}

@Injectable()
export class NotificationsEventsService {
  @Inject(IORedisKey)
  private readonly redisClient: Redis;

  @OnEvent('new.notification')
  async newNotification({ eventPayload, subject$, repository, entity }: ListenerPayload) {
    const stringifiedPayload = JSON.stringify(eventPayload);

    if (eventPayload.event === NOTIFICATION_TYPES.REPLY) {
      await repository.save(entity);

      return subject$.next(stringifiedPayload);
    } else if (eventPayload.event === NOTIFICATION_TYPES.VIEW) {
      return subject$.next(stringifiedPayload);
    } //cache it here maybe even ???

    const isCached = await this.redisClient.get(stringifiedPayload);

    if (!isCached) {
      await repository.save(entity);

      subject$.next(stringifiedPayload);

      await this.redisClient.set(stringifiedPayload, '1');
    }
  }
}