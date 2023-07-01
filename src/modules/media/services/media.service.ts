import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryRunner, Repository } from "typeorm";
import { Media } from "@/modules/media/entities/media.entitiy";
import { User } from "@/modules/users/entities/user.entity";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { MediaTypes } from "../constants";
import { messageUserNotFound, messageTweetNotFound } from "@/utils/global.constants";

@Injectable()
export class MediaService {
  @InjectRepository(Media)
  private readonly mediaRepository: Repository<Media>;

  async saveFilePath(
    filePath: string, 
    userId: number, 
    tweetId: number, 
    mediaType: MediaTypes, 
    queryRunner: QueryRunner
  ): Promise<void> {
    const user = await queryRunner.manager.findOneBy(User, { id: userId });
    if (!user) throw new BadRequestException(messageUserNotFound);

    const tweet = await queryRunner.manager.findOneBy(Tweet, { id: tweetId }); 
    if (!tweet) throw new BadRequestException(messageTweetNotFound);

    const mediaInstance = this.mediaRepository.create({
      path: filePath,
      user: user,
      media_type: mediaType,
      tweet
    });

    await queryRunner.manager.save(mediaInstance);
  }
}