import { User } from "../entities/user.entity";

export interface IGetFriendShipsCount {
  followingsCount: number;
  followersCount: number;
}

export interface IGetFriendShipFollowers {
  followers: Array<User>
}

export interface IGetFriendShipFollowing {
  following: Array<User>
}

export enum FriendshipActions {
  DESTROY = 'destroy',
  CREATE = 'create'
}