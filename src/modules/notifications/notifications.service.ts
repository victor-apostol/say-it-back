import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subject, filter, takeWhile } from "rxjs";
import { UsersService } from "../users/services/users.service";
import { TweetsService } from "../tweets/services/tweets.service";
import { LikesService } from "../likes/services/likes.service";
import { User } from "../users/entities/user.entity";
import { Notification } from "./notification.entity";
import { NOTIFICATIONS_PAGINATION_TAKE } from "../tweets/constants";
import { 
  FollowNotificationEvent, 
  TweetLikeEvent, 
  TweetReplySubject 
} from "./types/notification_events.types";

@Injectable()
export class NotificationsService implements OnModuleDestroy{
  @InjectRepository(Notification)
  private readonly notificationsRepository: Repository<Notification>;

  @InjectRepository(User)
  private readonly usersRepository: Repository<User>;

  constructor(
    private readonly usersSevice: UsersService, 
    private readonly tweetsService: TweetsService,
    private readonly likesService: LikesService,
  ) {
    this.handleFriendshipFollowEvent();
    this.handleTweetLikesEvents();
    this.handleTweetRepliesEvents();
  }

  private sseSubject$ = new Subject<string>()

  private handleFriendshipFollowEvent() {
    this.usersSevice.getFriendshipActionsObservable().subscribe((eventData) => {      
      this.sseSubject$.next(eventData as string);
    });
  }

  private handleTweetLikesEvents() {
    this.likesService.likesObservable().subscribe((eventData) => {
      this.sseSubject$.next(eventData as string);
    });
  }

  private handleTweetRepliesEvents() {
    this.tweetsService.tweetsRepliesObservable().subscribe((eventData) => {
      this.sseSubject$.next(eventData as string);
    });
  }

  async userNotifications(
    authUser: User, 
    offset = 0, 
    take = NOTIFICATIONS_PAGINATION_TAKE 
  ): Promise<{ notifications: Array<Notification>, hasMore: boolean }> {
    const userNotifications = await this.notificationsRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.action_user', 'action_user')
      .leftJoinAndSelect('notification.tweet', 'tweet')
      .leftJoin('tweet.media', 'media')
      .addSelect(['media.path'])
      .where('notification.target_user = :userId', { userId: authUser.id })
      .skip(offset)
      .take(take + 1)
      .getMany();

    const hasMore = userNotifications.length > take;
    if (hasMore) userNotifications.splice(-1); 

    if (authUser.notifications_count !== 0) {
      authUser.notifications_count = 0;
      await this.usersRepository.save(authUser);
    }

    return {
      notifications: userNotifications,
      hasMore
    }
  }

  getSseObservable(userId: number) {
    return this.sseSubject$.asObservable().pipe(
      takeWhile(() => true),
      filter((eventData) => { 
        const parsedEventData = JSON.parse(eventData) as Exclude<FollowNotificationEvent | TweetLikeEvent | TweetReplySubject, string>;
        
        return parsedEventData.eventTargetUserId === userId;
      })
    )
  }

  onModuleDestroy() {
    this.sseSubject$.complete();
  }
}
