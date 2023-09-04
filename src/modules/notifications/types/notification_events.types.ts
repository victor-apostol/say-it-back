import { NotificationTypes } from "./notification.types"

export type FollowNotificationEvent = {
  event: NotificationTypes;
  authUserUsername: string;
  eventTargetUsername: string; 
} | string;

export type TweetLikeEvent = {
  event: NotificationTypes, 
  authUserUsername: string;
  tweetId: number;
  eventTargetUsername: string;
} | string;

export type TweetReplySubject = {
  event: NotificationTypes; 
  authUserUsername: string;
  eventTargetUsername: string;
} | string;