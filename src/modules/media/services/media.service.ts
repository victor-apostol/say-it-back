import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryRunner, Repository } from "typeorm";
import { Media } from "@/modules/media/entities/media.entitiy";
import { User } from "@/modules/users/entities/user.entity";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { MediaTypes } from "../constants";
import { messageTweetNotFound } from "@/utils/global.constants";

@Injectable()
export class MediaService {
  @InjectRepository(Media)
  private readonly mediaRepository: Repository<Media>;

  async saveFilePath(
    filePath: string, 
    authUser: User, 
    tweetId: number, 
    mediaType: MediaTypes, 
    queryRunner: QueryRunner
  ): Promise<Media> {
    const tweet = await queryRunner.manager.findOneBy(Tweet, { id: tweetId }); 
    if (!tweet) throw new BadRequestException(messageTweetNotFound);
    
    const mediaInstance = this.mediaRepository.create({
      path: filePath,
      user: authUser,
      media_type: mediaType,
      tweet
    });

    await queryRunner.manager.save(mediaInstance);

    return mediaInstance;
  }
}