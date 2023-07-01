import { AuthUser } from "@/utils/decorators/authUser.decorator";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { IJwtPayload } from "@/modules/auth/interfaces/jwt.interface";
import { JwtGuard } from "@/modules/auth/guards/auth.guard";
import { CreateLikeDto } from "@/modules/likes/dto/create.dto";
import { Like } from "@/modules/likes/entities/like.entity";
import { LikesService } from "@/modules/likes/services/likes.service";
import { likesPath } from "@/modules/likes/constants";

@UseGuards(JwtGuard)
@Controller(likesPath)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('')
  async likeTweet(@AuthUser() user: IJwtPayload, @Body() body: CreateLikeDto): Promise<void> {
    await this.likesService.likeTweet(user, body);
  }
}