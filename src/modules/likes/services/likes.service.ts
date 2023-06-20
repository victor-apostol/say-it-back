import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { IJwtPayload } from "@/modules/auth/interfaces/jwt.interface";
import { CreateLikeDto } from "@/modules/likes/dto/create.dto";
import { User } from "@/modules/users/entities/user.entity";
import { Like } from "@/modules/likes/entities/like.entity";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { Comment } from "@/modules/comments/entitites/comment.entity";
import { 
  LikeableTargets, 
  messageCommentNotFound, 
  messageTargetIsAlreadyLiked, 
  messageTweetNotFound, 
  messageUserNotFound 
} from "@/modules/likes/constants";

@Injectable()
export class LikesService {
  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  @InjectRepository(Tweet)
  private readonly tweetRepository: Repository<Tweet>;

  @InjectRepository(Like)
  private readonly likeRepository: Repository<Like>;

  @InjectRepository(Comment)
  private readonly commentRepository: Repository<Comment>;

  constructor(private readonly dataSource: DataSource) {}

  async likeTarget(authUser: IJwtPayload, body: CreateLikeDto): Promise<void | BadRequestException> { 
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.userRepository.findOneBy({ id: authUser.id }); console.log(user)
      if (!user) throw new BadRequestException(messageUserNotFound);

      const [targetRepository, relation, errorMessage, selector] = body.likeable_target === "TWEET".toLowerCase()
        ? [this.tweetRepository, { tweet: undefined }, messageTweetNotFound, LikeableTargets.TWEET]
        : [this.commentRepository, { comment: undefined }, messageCommentNotFound, LikeableTargets.COMMENT];

      const target = await targetRepository.findOneBy({ id: body.targetId }); 
      if (!target) throw new BadRequestException(errorMessage);

      relation[Object.keys(relation)[0]] = target;
  
      const isTargetLiked = await this.likeRepository.findOne({ 
        where: {  
          user,
          ...relation,
          likeable_target: body.likeable_target
        },
        select: [selector]
      });
  
      if (isTargetLiked) throw new BadRequestException(messageTargetIsAlreadyLiked);
  
      const likeObject = this.likeRepository.create({
        user,
        ...relation,
        likeable_target: body.likeable_target
      });

      target.likes_count += 1;

      await queryRunner.manager.save(likeObject);
      await queryRunner.manager.save(target);
      
      await queryRunner.commitTransaction(); // could return update tweets / comment likes to front
    } catch(err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err?.message);
    } finally {
      await queryRunner.release();
    }
  }
}