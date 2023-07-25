import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Subject, filter, takeWhile } from "rxjs";
import { UsersService } from "../users/services/users.service";
import { TweetsService } from "../tweets/services/tweets.service";
import { FollowNotificationEvent, TweetLikeEvent } from "./notification_events.types";
import { LikesService } from "../likes/services/likes.service";

@Injectable()
export class NotificationsService implements OnModuleDestroy{
  constructor(
    private readonly usersSevice: UsersService, 
    private readonly tweetsService: TweetsService,
    private readonly likesService: LikesService,
  ) {
    this.handleFriendshipFollowEvent();
    this.handleTweetLikesEvents();
    this.handleTweetRepliesEvents();
  }

  private sseSubject$: Subject<string> = new Subject<string>()

  private handleFriendshipFollowEvent() {
    this.usersSevice.getFriendshipActionsObservable().subscribe((eventData) => {      
      this.sseSubject$.next(JSON.stringify(eventData));
    });
  }

  private handleTweetLikesEvents() {
    this.likesService.likesObservable().subscribe((eventData) => {
      console.log('wtf', eventData)
      this.sseSubject$.next(JSON.stringify(eventData));
    });
  }

  private handleTweetRepliesEvents() {
    this.tweetsService.tweetsRepliesObservable().subscribe((eventData) => {
      this.sseSubject$.next(JSON.stringify(eventData));
    });
  }

  getSseObservable(userId: number) {
    return this.sseSubject$.asObservable().pipe(
      takeWhile(() => true),
      filter((eventData) => { 
        const parsedEventData = JSON.parse(eventData) as FollowNotificationEvent | TweetLikeEvent;
        
        return parsedEventData.eventTargetUserId === userId;
      })
    )
  }

  onModuleDestroy() {
    this.sseSubject$.complete();
  }
}
