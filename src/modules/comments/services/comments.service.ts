import { IJwtPayload } from "@/modules/auth/interfaces/jwt.interface";
import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateCommentDto } from "@/modules/comments/dto/create.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "@/modules/users/entities/user.entity";
import { Repository } from "typeorm";
import { Comment } from "@/modules/comments/entitites/comment.entity";

@Injectable()
export class CommentsService {
  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  @InjectRepository(Comment)
  private readonly commentRepository: Repository<Comment>;

  async createComment(authUser: IJwtPayload, body: CreateCommentDto): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: authUser.id });

    if (!user) throw new BadRequestException("user not found"); // do global constant
  
    const commentObject = this.commentRepository.create({
      ...body
    });

    await this.commentRepository.save(commentObject);
  }
}