import { JwtGuard } from "@/modules/auth/guards/auth.guard";
import { IJwtPayload } from "@/modules/auth/interfaces/jwt.interface";
import { AuthUser } from "@/utils/decorators/authUser.decorator";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CreateCommentDto } from "@/modules/comments/dto/create.dto";
import { CommentsService } from "../services/comments.service";

@UseGuards(JwtGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('') // check for the auth header 
  async createComment(@AuthUser() user: IJwtPayload, @Body() body: CreateCommentDto): Promise<void> {
    await this.commentsService.createComment(user, body)
  }
}