import { Friendship } from "../entities/friendship.entity";

export interface IGetFriendShipsCount {
  followingsCount: number;
  followersCount: number;
}

export interface IGetFriendShipFollowers {
  followers: Array<Friendship>
}

export interface IGetFriendShipFollowing {
  following: Array<Friendship>
}

export enum FriendshipActions {
  DESTROY = 'destroy',
  CREATE = 'create'
}