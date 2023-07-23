import { NotificationTypes } from "./notification.types";

export type FollowNotificationEvent = {
  event: NotificationTypes, 
  authUserId: number, 
  eventTargetUserId: number 
}

export type TweetLikeEvent = {
  authUserId: number;
  eventTargetUserId: number;
}