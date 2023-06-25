import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryRunner, Repository } from "typeorm";
import { Media } from "@/modules/media/entities/media.entitiy";
import { User } from "@/modules/users/entities/user.entity";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { Comment } from "@/modules/comments/entitites/comment.entity";
import { MediaTypes } from "../constants";
import { messageUserNotFound, TargetsTypes, messageCommentNotFound, messageTweetNotFound } from "@/utils/global.constants";

@Injectable()
export class MediaService {
  @InjectRepository(Media)
  private readonly mediaRepository: Repository<Media>;

  @InjectRepository(Tweet)
  private readonly tweetRepository: Repository<Tweet>;

  @InjectRepository(Comment)
  private readonly commentRepository: Repository<Comment>;

  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  async saveFilePath(
    filePath: string, 
    userId: number, 
    targetId: number, 
    mediaType: MediaTypes, 
    targetType: TargetsTypes,
    queryRunner: QueryRunner
  ): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new BadRequestException(messageUserNotFound);

    const [targetRepository, relation, errorMessage] = targetType === "TWEET".toLowerCase()
      ? [this.tweetRepository, { tweet: undefined }, messageTweetNotFound]
      : [this.commentRepository, { comment: undefined }, messageCommentNotFound];

    const target = await targetRepository.findOneBy({ id: targetId }); 
    if (!target) throw new BadRequestException(errorMessage);

    relation[Object.keys(relation)[0]] = target;

    const mediaInstance = this.mediaRepository.create({
      path: filePath,
      user: user,
      media_type: mediaType,
      ...relation,
    });

    await queryRunner.manager.save(mediaInstance);
  }
}