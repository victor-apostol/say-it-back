import { NOTIFICATION_TYPES } from "./notification.types";

type TweetSubjectBase = {
  event: NOTIFICATION_TYPES;
  authUserUsername: string;
  eventTargetUsername: string;
};

export type FollowNotificationSubject = TweetSubjectBase | string;
export type TweetLikeSubject = TweetSubjectBase & { tweetId: number } | string;
export type TweetReplySubject = TweetSubjectBase & { tweetId: number } | string;
export type TweetViewSubject = TweetSubjectBase & { tweetId: number } | string;