import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Subject, filter, takeWhile } from "rxjs";
import { UsersService } from "../users/services/users.service";
import { TweetsService } from "../tweets/services/tweets.service";

@Injectable()
export class NotificationsService implements OnModuleDestroy{
  private sseSubject$: Subject<string> = new Subject<string>();
  private connectionActive: boolean = true;

  constructor(private readonly usersSevice: UsersService, private readonly tweetsService: TweetsService) {
    this.handleFriendshipFollowEvent();
    this.handleTweetLikesEvents();
    this.handleTweetRepliesEvents
  }

  private handleFriendshipFollowEvent() {
    this.usersSevice.getFriendshipActionsObservable().subscribe((eventData) => {      
      this.sseSubject$.next(JSON.stringify({
        payload: eventData
      }));
    });
  }

  private handleTweetLikesEvents() {
    this.tweetsService.tweetsLikesObservable().subscribe((eventData) => {
      this.sseSubject$.next(JSON.stringify({
        payload: eventData
      }));
    });
  }

  private handleTweetRepliesEvents() {
    this.tweetsService.tweetsRepliesObservable().subscribe((eventData) => {
      this.sseSubject$.next(JSON.stringify({
        payload: eventData
      }));
    });
  }

  getSseObservable(userId: number) {
    return this.sseSubject$.asObservable().pipe(
      takeWhile(() => this.connectionActive),
      filter((eventData) => { 
        const parsedEventData = JSON.parse(eventData);
        
        return parsedEventData.payload.targetUserId === userId;
      })
    )
  }

  onModuleDestroy() {
    this.connectionActive = false;
    this.sseSubject$.complete();
  }
}
