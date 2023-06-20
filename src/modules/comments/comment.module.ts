import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Comment } from "@/modules/comments/entitites/comment.entity";
import { CommentsService } from "@/modules/comments/services/comments.service";
import { CommentsController } from "@/modules/comments/controllers/comments.controller";
import { User } from "@/modules/users/entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, User]),
  ],
  providers: [CommentsService],
  controllers: [CommentsController]
})
export class CommentModule {}