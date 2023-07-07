import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  ParseFilePipe, 
  ParseIntPipe, 
  Patch, 
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

  @Get('user/:userId') 
  async getUserTweets(
    @Param('userId', ParseIntPipe) userId: number, 
    @Query() query: TweetPaginationDto
  ): Promise<IPaginatedTweets> { console.log("FETCHIN USER TWEETS")
    return await this.tweetsService.getUserTweets(userId, query.offset, query.count);
  }

  @Get('/user/:userId/:tweetId') 
  async getTweet( 
    @Param('userId', ParseIntPipe) userId: number, 
    @Param('tweetId', ParseIntPipe) tweetId: number
  ): Promise<ITweetResponse> { console.log("FETCHIN A TWEET")
    return await this.tweetsService.getTweet(userId, tweetId);
  } 
  
  @Get('/replies/:tweetId')
  async getTweetReplies(
    @AuthUser() user: IJwtPayload,
    @Param('tweetId', ParseIntPipe) tweetId: number,
    @Query() query: TweetPaginationDto
  ): Promise<{ tweets: Array<Tweet> }>  { console.log("FETCHIN REPLIES")
    return { tweets: await this.tweetsService.getTweetReplies(user.id, tweetId, query.offset, query.count) }
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
  ): Promise<Tweet> {
    return await this.tweetsService.createTweet(authUser, body, files);
  }
}