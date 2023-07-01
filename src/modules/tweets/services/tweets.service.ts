import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Tweet } from "../entities/tweet.entity";
import { CreateTweetDto } from "../dto/createTweet.dto";
import { UsersService } from "@/modules/users/services/users.service";
import { StorageService } from "@/modules/media/services/storage.service";
import { MediaTypes } from "@/modules/media/constants";
import { IPaginatedTweets } from "../interfaces/paginate_tweets.interface";
import { IJwtPayload } from "@/modules/auth/interfaces/jwt.interface";
import { messageParentTweetDoesNotExist, messageTweetCouldNotBeCreated, messageUserNotFound } from "@/utils/global.constants";

@Injectable()
export class TweetsService {
  @InjectRepository(Tweet)
  private readonly tweetsRepository: Repository<Tweet>;

  constructor(
    private readonly usersService: UsersService, 
    private readonly storageService: StorageService,
    private readonly dataSource: DataSource,   
  ) {}

  async createTweet(
    authUser: IJwtPayload, 
    body: CreateTweetDto, 
    files: Array<Express.Multer.File>,
    parent_id: number | undefined = undefined, 
    media_type = MediaTypes.IMAGE
  ): Promise<Tweet> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    
    try {
      const user = await this.usersService.findUser(authUser.id);
      if (!user) throw new BadRequestException(messageUserNotFound);

      let parent_tweet: Tweet | null | undefined = undefined;

      if (parent_id) {
        parent_tweet = await this.tweetsRepository.findOneBy({ id: parent_id });
        if (!parent_tweet) throw new BadRequestException(messageParentTweetDoesNotExist);
      } 

      const tweet = this.tweetsRepository.create({
        ...body,
        user,
        media: [],
        parent_tweet
      });

      await queryRunner.manager.save(tweet);

      if (files.length > 0) await this.storageService.uploadFileToS3Bucket(files, authUser.id, tweet.id, media_type, queryRunner); 

      await queryRunner.commitTransaction();

      return tweet;
    } catch(err) {
      await queryRunner.rollbackTransaction()
      throw new InternalServerErrorException(messageTweetCouldNotBeCreated);
    } finally {
      await queryRunner.release();
    }
  }

  async getTweet(id: number): Promise<Tweet | null> {
    return await this.tweetsRepository.findOneBy({ id });
  }

  async getUserTweets(userId: number, offset = 0, count = 5): Promise<IPaginatedTweets> {
    const user = await this.usersService.findUser(userId); 
    if (!user) throw new BadRequestException(messageUserNotFound);

    const tweets = await this.tweetsRepository.find({
      where: {
        user: { id: user.id },        
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
      skip: offset,
      take: count + 1
    });

    const hasMore = tweets.length > count;
    
    return {
      tweets: tweets.slice(0, count), 
      hasMore
    }
  }
}