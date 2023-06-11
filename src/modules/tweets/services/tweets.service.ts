import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateTweetDto } from "../dto/createTweet.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tweet } from "../entities/tweet.entity";
import { IJwtPayload } from "src/modules/auth/interfaces/jwt.interface";
import { UserService } from "src/modules/users/services/user.service";
import { messageUserNotFound } from "src/modules/auth/constants";

@Injectable()
export class TweetsService {
  @InjectRepository(Tweet)
  private readonly tweetsRepository: Repository<Tweet>;

  constructor(private readonly usersService: UserService) {}

  async createTweet(authUser: IJwtPayload, body: CreateTweetDto): Promise<void> {
    const user = await this.usersService.findUser(authUser.id);
 
    if (!user) throw new BadRequestException(messageUserNotFound);

    const tweet = this.tweetsRepository.create({
      ...body,
      user
    });

    await this.tweetsRepository.save(tweet);
  }

  async getTweet(id: number): Promise<Tweet | null> {
    return await this.tweetsRepository.findOneBy({ id });
  }

  async getUserTweets(userId: number): Promise<Array<Tweet>> {
    const user = await this.usersService.findUser(userId);
    
    if (!user) throw new BadRequestException(messageUserNotFound);

    return await this.tweetsRepository.find({
      where: {
        user: { id: user.id }
      }
    });
  }
}