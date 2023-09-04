import { Body, Controller, Delete, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { AuthUser } from "@/utils/decorators/authUser.decorator";
import { JwtGuard } from "@/modules/auth/guards/auth.guard";
import { CreateLikeDto } from "@/modules/likes/dto/create.dto";
import { LikesService } from "@/modules/likes/services/likes.service";
import { likesPath } from "@/modules/likes/constants";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { User } from "@/modules/users/entities/user.entity";

@UseGuards(JwtGuard)
@Controller(likesPath)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('')
  async createLike(
    @AuthUser() user: User, 
    @Body() body: CreateLikeDto
  ): Promise<Tweet & { likeId: number }> {
    return await this.likesService.createLike(user, body);
  }

  @Delete('/:likeId/:tweetId')
  async likeAction(
    @AuthUser() user: User, 
    @Param('likeId', ParseIntPipe) likeId: number, 
    @Param('tweetId', ParseIntPipe) tweetid: number
  ): Promise<{ success: boolean }> {
    return await this.likesService.deleteLike(user, likeId, tweetid);
  }
}