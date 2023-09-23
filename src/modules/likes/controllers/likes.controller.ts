import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards } from "@nestjs/common";
import { AuthUser } from "@/utils/decorators/authUser.decorator";
import { JwtGuard } from "@/modules/auth/guards/auth.guard";
import { CreateLikeDto } from "@/modules/likes/dto/create.dto";
import { LikesService } from "@/modules/likes/services/likes.service";
import { likesPath } from "@/modules/likes/constants";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { User } from "@/modules/users/entities/user.entity";
import { Like } from "../entities/like.entity";
import { PaginationDto } from "@/utils/global/pagination.dto";

@UseGuards(JwtGuard)
@Controller(likesPath)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Get('tweet/:tweetId')
  async getTweetLikes(
    @AuthUser() user: User, 
    @Param('tweetId', ParseIntPipe) tweetId: number,
    @Query() query: PaginationDto
   ): Promise<{likes: Array<Like>, hasMore: boolean}> {
    return await this.likesService.getTweetLikes(user.id, tweetId, query.offset, query.take);
  }

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