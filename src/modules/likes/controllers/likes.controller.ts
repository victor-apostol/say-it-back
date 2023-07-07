import { BadRequestException, Body, Controller, Delete, Header, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { AuthUser } from "@/utils/decorators/authUser.decorator";
import { IJwtPayload } from "@/modules/auth/interfaces/jwt.interface";
import { JwtGuard } from "@/modules/auth/guards/auth.guard";
import { CreateLikeDto } from "@/modules/likes/dto/create.dto";
import { LikesService } from "@/modules/likes/services/likes.service";
import { likesPath } from "@/modules/likes/constants";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";

@UseGuards(JwtGuard)
@Controller(likesPath)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('')
  async createLike(
    @AuthUser() user: IJwtPayload, 
    @Body() body: CreateLikeDto
  ): Promise<{ tweet: Tweet, likeId: number } | BadRequestException> {
    return await this.likesService.createLike(user, body);
  }

  @Delete('/:likeId/:tweetId')
  async likeAction(
    @AuthUser() user: IJwtPayload, 
    @Param('likeId', ParseIntPipe) likeId: number, 
    @Param('tweetId', ParseIntPipe) tweetid: number
  ): Promise<{ success: boolean }> {
    return await this.likesService.deleteLike(user, likeId, tweetid);
  }
}