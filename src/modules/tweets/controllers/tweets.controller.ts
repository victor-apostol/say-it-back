import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  ParseFilePipe, 
  ParseIntPipe, 
  Post, 
  Query, 
  UploadedFiles, 
  UseGuards, 
  UseInterceptors 
} from "@nestjs/common";
import { tweetsPath } from "../constants";
import { CreateTweetDto } from "../dto/createTweet.dto";
import { JwtGuard } from "src/modules/auth/guards/auth.guard";
import { TweetsService } from "../services/tweets.service";
import { AuthUser } from "src/utils/decorators/authUser.decorator";
import { IJwtPayload } from "src/modules/auth/interfaces/jwt.interface";
import { Tweet } from "../entities/tweet.entity";
import { TweetPaginationDto } from "../dto/pagination.dto";
import { IPaginatedTweets } from "../interfaces/paginateTweets.interface";
import { FilesInterceptor } from "@nestjs/platform-express";
import { fileMaxSizeInKb, maxFilesCount } from "@/modules/media/constants";
import { MediaValidator } from "@/modules/media/validators/media.validator";
import { ITweetResponse } from "../interfaces/TweetResponse.interface";

@UseGuards(JwtGuard)
@Controller(tweetsPath)
export class TweetsController {
  constructor(private readonly tweetsService: TweetsService) {}

  @Get('/feed')
  async getFeedTweets(
    @AuthUser() user: IJwtPayload, 
    @Query() query: TweetPaginationDto
  ): Promise<IPaginatedTweets> {
    console.log('get feed', query)
    return await this.tweetsService.getFeedTweets(user, query.offset, query.take);
  }

  @Get('user/:userId') 
  async getUserTweets(
    @Param('userId', ParseIntPipe) userId: number, 
    @Query() query: TweetPaginationDto
  ): Promise<IPaginatedTweets> { 
    return await this.tweetsService.getUserTweets(userId, query.offset, query.take);
  }

  @Get('/user/:userId/:tweetId') 
  async getTweet( 
    @Param('userId', ParseIntPipe) userId: number, 
    @Param('tweetId', ParseIntPipe) tweetId: number
  ): Promise<ITweetResponse> { 
    return await this.tweetsService.getTweet(userId, tweetId);
  } 
  
  @Get('/replies/:tweetId')
  async getTweetReplies(
    @AuthUser() user: IJwtPayload,
    @Param('tweetId', ParseIntPipe) tweetId: number,
    @Query() query: TweetPaginationDto
  ): Promise<{ tweets: Array<Tweet> }>  { 
    return { tweets: await this.tweetsService.getTweetReplies(user.id, tweetId, query.offset, query.take) }
  }

  @Post('')
  @UseInterceptors(FilesInterceptor('files[]', maxFilesCount, { limits: { files: maxFilesCount } }))
  async createTweet(
    @AuthUser() authUser: IJwtPayload, 
    @Body() body: CreateTweetDto,
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MediaValidator({ maxSize: fileMaxSizeInKb })
        ],
      })
    ) files: Array<Express.Multer.File>
  ): Promise<{ tweet: Tweet, successMessage: string }> {
    return await this.tweetsService.createTweet(authUser, body, files);
  }
}