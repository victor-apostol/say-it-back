import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { tweetsPath } from "../constants";
import { CreateTweetDto } from "../dto/createTweet.dto";
import { JwtGuard } from "src/modules/auth/guards/auth.guard";
import { TweetsService } from "../services/tweets.service";
import { AuthUser } from "src/utils/decorators/authUser.decorator";
import { IJwtPayload } from "src/modules/auth/interfaces/jwt.interface";
import { Tweet } from "../entities/tweet.entity";

@UseGuards(JwtGuard)
@Controller(tweetsPath)
export class TweetsController {
  constructor(private readonly tweetsService: TweetsService) {}

  @Get('user/:userId')
  async getUserTweets(@Param('userId', ParseIntPipe) userId: number): Promise<Array<Tweet>> {
    return await this.tweetsService.getUserTweets(userId);
  }

  @Get(':id')
  async getTweet(@Param('id', ParseIntPipe) id: number): Promise<Tweet | null> {
    return await this.tweetsService.getTweet(id);
  }
  
  @Post('')
  async createTweet(@AuthUser() authUser: IJwtPayload, @Body() body: CreateTweetDto): Promise<void> {
    return await this.tweetsService.createTweet(authUser, body);
  }
}