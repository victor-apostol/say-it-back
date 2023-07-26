import { NotificationTypes } from "./notification.types"

export type FollowNotificationEvent = {
  event: NotificationTypes;
  authUserId: number;
  eventTargetUserId: number; 
} | string;

export type TweetLikeEvent = {
  event: NotificationTypes, 
  authUserId: number;
  tweetId: number;
  eventTargetUserId: number;
} | string;

export type TweetReplySubject = {
  event: NotificationTypes; 
  authUserId: number;
  eventTargetUserId: number;
} | string;