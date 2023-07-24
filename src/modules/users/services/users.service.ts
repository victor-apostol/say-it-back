import { BadRequestException, Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FollowNotificationEvent } from "@/modules/notifications/notification_events.types";
import { NotificationTypes } from "@/modules/notifications/notification.types";
import { Subject } from "rxjs";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { FriendshipActions } from "../interfaces/friendship.interface";
import { messageUserNotFound } from "@/utils/global.constants";
import { IORedisKey } from "@/modules/redis/redis.types";
import Redis from "ioredis";

@Injectable()
export class UsersService implements OnModuleDestroy {
  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  @Inject(IORedisKey)
  private readonly redisClient: Redis;

  async findUser(id: number): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }

  private readonly friendshipAction$ = new Subject<FollowNotificationEvent>();
 
  async friendshipAction(authUser: User, targetUserId: number, action: string) {
    if (authUser.id === targetUserId) throw new BadRequestException("You can't follow you're self");

    const targetUser = await this.userRepository.findOne({ 
      where: {
        id: targetUserId 
      }, 
      relations: ['followed']
    });
    if (!targetUser) throw new BadRequestException(messageUserNotFound);  

    const friendship = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('friendships', 'friendship', 'user.id = friendship.followed_id') 
      .where('friendship.following_id = :userId AND friendship.followed_id = :targetUserId', { 
        userId: authUser.id, targetUserId: targetUserId
      })
      .getOne();

    if (action == FriendshipActions.CREATE) {
      if (friendship) throw new BadRequestException("You are already following this user");

      const userWithRelations = await this.userRepository.findOne({ 
        where: { 
          id: authUser.id
        }, 
        relations: ['following']
      });

      if (!userWithRelations) throw new BadRequestException(messageUserNotFound);
      
      userWithRelations.following.push(targetUser);
      targetUser.followed.push(userWithRelations);

      await this.userRepository.save(userWithRelations);

      const eventPayload = { 
        event: NotificationTypes.FOLLOW, 
        authUserId: authUser.id, 
        eventTargetUserId: targetUser.id 
      }

      const stringifiedPayload = JSON.stringify(eventPayload);

      const isCached = await this.redisClient.get(stringifiedPayload);
      if (!isCached) {
        // write event to DB
        this.friendshipAction$.next(eventPayload);

        await this.redisClient.set(stringifiedPayload, '1');
      }
      // add this to notifs table then commit transaction then send the send event
    } else if (action == FriendshipActions.DESTROY) {
      if (!friendship) throw new BadRequestException("You are not yet following this user");

      targetUser.followed = targetUser.followed.filter(user => {
        return user.id !== authUser.id
      });

      await this.userRepository.save(targetUser);
    }
  }

  async getUserProfileInfo(
    targetUserId: number, 
    authUser: User
  ): Promise<{user: User, followingsCount: number, followersCount: number, amIfollowing?: boolean }> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.followed", "followed")
      .leftJoinAndSelect("user.following", "following")
      .where("user.id = :userId", { userId: targetUserId })
      .select(["user","following.id","followed.id"])
      .getOne();

    if (!user) throw new BadRequestException(messageUserNotFound);

    const returnObject = {
      user,
      followingsCount: user.following.length, 
      followersCount: user.followed.length,
    };
    
    const amIfollowing = user.followed.some(follower => follower.id === authUser.id);

    return targetUserId !== authUser.id 
      ? {...returnObject, amIfollowing: amIfollowing} 
      : returnObject; 
  }
  
  getFriendshipActionsObservable() {
    return this.friendshipAction$.asObservable();
  }

  onModuleDestroy() {
    this.friendshipAction$.complete();
  }

  async followsRecomandation(user: User): Promise<Array<User>> {
    const authUser = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.following", "following")
      .where("user.id = :userId", { userId: user.id })
      .select(["user.id","following.id"])
      .getOne();

    if (!authUser) throw new BadRequestException(messageUserNotFound);

    const followingsOfFollowings = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.following", "following")
      .leftJoinAndSelect("following.following", "followingsOfFollowings")
      .where("user.id = :userId", { userId: user.id })
      .andWhere('followingsOfFollowings.id NOT IN (:...followedIds)', { followedIds: authUser.following.map((followingUser) => followingUser.id) })
      // .orderBy('RANDOM()')
      .getOne()

      const flattenedUsers = followingsOfFollowings 
      ? followingsOfFollowings.following.flatMap((followedUser) =>
          followedUser.following.filter((user) => !followingsOfFollowings.following.map((followedUser) => followedUser.id).includes(user.id))
        )
      : [];// fetch top people on twitter

      // populate with wheter i am folowing or nah the user

    return flattenedUsers;
  }
}

