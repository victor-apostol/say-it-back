import { NotificationTypes } from "./notification.types";

export type FollowNotificationEvent = {
  event: NotificationTypes;
  authUserId: number;
  eventTargetUserId: number; 
}

export type TweetLikeEvent = {
  event: NotificationTypes, 
  authUserId: number;
  likeId: number;
  eventTargetUserId: number;
}

export type TweetReplySubject = {
  event: NotificationTypes; 
  authUserId: number;
  eventTargetUserId: number;
}