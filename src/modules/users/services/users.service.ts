import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { IJwtPayload } from "@/modules/auth/interfaces/jwt.interface";

@Injectable()
export class UsersService {
  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  async findUser(id: number): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }

  async getFollowingList(user: IJwtPayload, offset: number, take: number) {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.tweets', 'tweet')
      .leftJoinAndSelect('tweet.media', 'media')
      .leftJoinAndSelect('tweet.user', 'tweet_user')
      .leftJoinAndSelect('tweet.likes', 'like')
      .leftJoinAndSelect('like.user', 'like_user')
      .innerJoin('user.follower', 'follower', 'follower.id = :userId', { userId: user.id })
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('tweet.id')
          .from('Tweet', 'tweet')
          .where('tweet.userId = user.id')
          .orderBy('tweet.created_at', 'DESC')
          .offset(offset) 
          .limit(take)  // + 1 
          .getQuery();
    
        return `tweet.id IN ${subQuery}`;
      })
      .select(['user', 'tweet', 'like', 'like.user', 'like_user', 'tweet_user', 'media'])
      .orderBy('RANDOM()')
      .getMany();

    return users;
  }
}

