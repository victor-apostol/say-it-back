import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { IJwtPayload } from "@/modules/auth/interfaces/jwt.interface";
import { CreateLikeDto } from "@/modules/likes/dto/create.dto";
import { User } from "@/modules/users/entities/user.entity";
import { Like } from "@/modules/likes/entities/like.entity";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { messageTweetNotFound, messageUserNotFound } from "@/utils/global.constants";
import { messageTweetIsAlreadyLiked } from "../constants";

@Injectable()
export class LikesService {
  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  @InjectRepository(Tweet)
  private readonly tweetRepository: Repository<Tweet>;

  @InjectRepository(Like)
  private readonly likeRepository: Repository<Like>;

  constructor(private readonly dataSource: DataSource) {}

  async createLike(authUser: IJwtPayload, body: CreateLikeDto): Promise<any | BadRequestException> { 
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.userRepository.findOneBy({ id: authUser.id });
      if (!user) throw new BadRequestException(messageUserNotFound);

      const tweet = await this.tweetRepository.findOneBy({ id: body.tweetId }); 
      if (!tweet) throw new BadRequestException(messageTweetNotFound);
  
      const isTweetLiked = await this.likeRepository.findOne({ 
        where: {  
          user,
          tweet: { id: tweet.id}          
        }
      });
  
      if (isTweetLiked) throw new BadRequestException(messageTweetIsAlreadyLiked);
  
      const likeObject = this.likeRepository.create({
        user,
        tweet
      });
    
      tweet.likes_count = tweet.likes_count + 1;

      const like = await queryRunner.manager.save(likeObject);
      await queryRunner.manager.save(tweet);
      
      await queryRunner.commitTransaction(); 

      return { ...tweet, likeId: like.id }
    } catch(err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err?.message);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteLike(authUser: IJwtPayload, likeId: number, tweetId: number): Promise<{ success: boolean }> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tweet = await this.tweetRepository.findOneBy({ id: tweetId });
      if (!tweet) throw new BadRequestException(messageTweetNotFound);
      
      const result = await this.likeRepository.delete({
        id: likeId,
        user: { 
          id: authUser.id 
        },
        
      });
      
      if (result.affected == 0) throw new BadRequestException('Can\'t unlike this tweet');
      
      tweet.likes_count = tweet.likes_count - 1;
      await this.tweetRepository.save(tweet);
  
      return { success: true }
    } catch(err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err?.message);
    } finally {
      await queryRunner.release();
    }
  }
}