import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateTweetDto } from "../dto/createTweet.dto";
import { Tweet } from "../entities/tweet.entity";
import { IJwtPayload } from "@/modules/auth/interfaces/jwt.interface";
import { UsersService } from "@/modules/users/services/users.service";
import { messageUserNotFound } from "@/utils/global.constants";
import { IPaginatedTweets } from "../interfaces/paginate_tweets.interface";

@Injectable()
export class TweetsService {
  @InjectRepository(Tweet)
  private readonly tweetsRepository: Repository<Tweet>;

  constructor(private readonly usersService: UsersService) {}

  async createTweet(authUser: IJwtPayload, body: CreateTweetDto): Promise<void> {
    const user = await this.usersService.findUser(authUser.id);
    if (!user) throw new BadRequestException(messageUserNotFound);

    const tweet = this.tweetsRepository.create({
      ...body,
      user,
      media: []
    });

    await this.tweetsRepository.save(tweet);
  }

  async getTweet(id: number): Promise<Tweet | null> {
    return await this.tweetsRepository.findOneBy({ id });
  }

  async getUserTweets(userId: number, page = 0, count = 5): Promise<IPaginatedTweets> {
    const user = await this.usersService.findUser(userId); 
    if (!user) throw new BadRequestException(messageUserNotFound);

    const tweets = await this.tweetsRepository.find({
      where: {
        user: { id: user.id }
      },
      relations: ['media', 'user'], 
      select: { 
        user: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          avatar: true,
        }
      },
      skip: page,
      take: count + 1
    });

    const hasMore = tweets.length > count;

    return {
      tweets: tweets.slice(0, count), 
      hasMore
    }
  }
}