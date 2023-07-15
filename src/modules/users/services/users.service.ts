import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { FriendshipActions } from "../interfaces/friendship.interface";
import { messageUserNotFound } from "@/utils/global.constants";
import { Friendship } from "../entities/friendship.entity";
import { IGetFriendShipsCount } from "../interfaces/friendship.interface";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>
  ) {}

  async findUser(id: number, authUser: User): Promise<User | null> {
    console.log(await this.userRepository
      .createQueryBuilder('user')
  .innerJoin('Friendship', 'friendship', 'friendship.follower = user.id')
  .leftJoinAndSelect('friendship.follower', 'lol')
  .getMany()
    )

    return await this.userRepository.findOneBy({ id });

  }
  
  userFollowersQuery = this.friendshipRepository
    .createQueryBuilder('friendship')
    .leftJoinAndSelect('friendship.follower', 'follower')

  userFollowingsQuery = this.friendshipRepository
    .createQueryBuilder('friendship')
    .leftJoinAndSelect('friendship.following', 'following')

  async getFollowingUsersTweets(authUser: User, offset: number, take: number) {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.tweets', 'tweet')
      .leftJoinAndSelect('tweet.media', 'media')
      .leftJoinAndSelect('tweet.user', 'tweet_user')
      .leftJoinAndSelect('tweet.likes', 'like')
      .leftJoinAndSelect('like.user', 'like_user')
      .innerJoin('Friendship', 'friendship', 'friendship.follower = :userId', { userId: authUser.id })
      .leftJoinAndSelect('friendship.following', 'friendship_users')
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('tweet.id')
          .from('Tweet', 'tweet')
          .where('tweet.userId = friendship_users.id')
          .andWhere('tweet.parent_tweet IS NULL')
          .orderBy('tweet.created_at', 'DESC')
          .offset(offset)
          .limit(take)
          .getQuery();
        console.log(`tweet.id IN ${subQuery}`)
        return `tweet.id IN ${subQuery}`;
      })
      .select(['user', 'tweet', 'like', 'like_user', 'tweet_user', 'media'])
      .orderBy('RANDOM()')
      .getMany();
  
    return users;
  }

  async friendshipAction(authUser: User, targetUserId: number, action: string) {
    if (authUser.id === targetUserId) throw new BadRequestException("You can't follow you're self");

    const targetUser = await this.userRepository.findOneBy({ id: targetUserId });
    if (!targetUser) throw new BadRequestException(messageUserNotFound);
    
    const findFriendship = await this.friendshipRepository.findOne({
      where: {
        following: { id: targetUserId },
        follower: { id: authUser.id }
      }
    });

    if (action == FriendshipActions.CREATE) {
      if (findFriendship) throw new BadRequestException("You are already following this user");

      const newFriendship = this.friendshipRepository.create({
        follower: { id: authUser.id },
        following: { id: targetUserId }
      });

      await this.friendshipRepository.save(newFriendship);
    } else if(action == FriendshipActions.DESTROY) {
      if (!findFriendship) throw new BadRequestException("You are not yet following this user");

      const result = await this.friendshipRepository.delete({
        following: { id: targetUserId },
        follower: { id: authUser.id }
      });

      if (result.affected === 0) throw new BadRequestException("Unable to unfollow user, invalid user"); 
    }
  }

  async getFriendshipsCount(targetUserId: number): Promise<IGetFriendShipsCount> {
    const followersCount = await this.userFollowersQuery
      .where('friendship.followingId = :userId', { userId: targetUserId })
      .getCount()

    const followingsCount = await this.userFollowingsQuery
      .where('friendship.followerId = :userId', { userId: targetUserId })
      .getCount()
 
    return { followingsCount, followersCount }
  }

  // async getFriendshipsFollowing(authUser: User): Promise<IGetFriendShipFollowing> {

  // }

  // async getFriendshipsFollowers(authUser: User): Promise<IGetFriendShipFollowers> {
    
  // }
}

