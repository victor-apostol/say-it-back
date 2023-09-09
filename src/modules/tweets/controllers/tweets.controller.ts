import { 
  BadRequestException,
  Body, 
  Controller, 
  Delete, 
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
import { FilesInterceptor } from "@nestjs/platform-express";

import { JwtGuard } from "src/modules/auth/guards/auth.guard";
import { TweetsService } from "../services/tweets.service";
import { StorageService } from "@/modules/media/services/storage.service";
import { Tweet } from "../entities/tweet.entity";
import { User } from "@/modules/users/entities/user.entity";
import { CreateTweetDto } from "../dto/createTweet.dto";
import { PaginationDto } from "@/utils/global/pagination.dto";
import { MediaValidator } from "@/modules/media/validators/media.validator";
import { IPaginatedTweets } from "../interfaces/paginateTweets.interface";
import { ITweetResponse } from "../interfaces/TweetResponse.interface";
import { AuthUser } from "src/utils/decorators/authUser.decorator";
import { imageExtensionsWhitelist, imageMaxSizeInBytes, maxFilesCount, videoExtensionsWhitelist, videoMaxSizeInBytes } from "@/modules/media/constants";
import { tweetsPath } from "../constants";

@UseGuards(JwtGuard)
@Controller(tweetsPath)
export class TweetsController {
  constructor(
    private readonly tweetsService: TweetsService,
    private readonly storageService: StorageService
  ) {}

  @Get('/feed')
  async getFeedTweets(
    @AuthUser() user: User, 
    @Query() query: PaginationDto
  ): Promise<IPaginatedTweets> {
    return await this.tweetsService.getFeedTweets(user, query.offset, query.take);
  }

  @Get('user/:username') 
  async getUserTweets(
    @Param('username') targetUsername: string, 
    @Query() query: PaginationDto
  ): Promise<IPaginatedTweets> { 
    return await this.tweetsService.getUserTweets(targetUsername, query.offset, query.take);
  }

  @Get('/user/:username/:tweetId') 
  async getTweet( 
    @AuthUser() user: User,
    @Param('username') targetUsername: string, 
    @Param('tweetId', ParseIntPipe) tweetId: number
  ): Promise<ITweetResponse> { 
    return await this.tweetsService.getTweet(user, targetUsername, tweetId);
  } 
  
  @Get('/replies/:tweetId')
  async getTweetReplies(
    @AuthUser() user: User,
    @Param('tweetId', ParseIntPipe) tweetId: number,
    @Query() query: PaginationDto
  ): Promise<{ tweets: Array<Tweet> }>  { 
    return { tweets: await this.tweetsService.getTweetReplies(user.username, tweetId, query.offset, query.take) }
  }

  @Post('/view')
  async viewTweet(@AuthUser() user: User, @Body('tweetId', ParseIntPipe) tweetId: number): Promise<void> {
    return await this.tweetsService.viewTweet(user, tweetId);
  }

  @Post('')
  @UseInterceptors(FilesInterceptor('files[]', maxFilesCount, { limits: { files: maxFilesCount } }))
  async createTweet(
    @AuthUser() authUser: User, 
    @Body() body: CreateTweetDto,
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MediaValidator({ 
            whitelist: [{
              allowedExtensions: imageExtensionsWhitelist,
              mimeTypeMaxAllowedSizeBytes: imageMaxSizeInBytes
            },{
              allowedExtensions: videoExtensionsWhitelist,
              mimeTypeMaxAllowedSizeBytes: videoMaxSizeInBytes
            }]
          })
        ],
      })
    ) files: Array<Express.Multer.File>
  ): Promise<{ tweet: Tweet, successMessage: string }> {
    this.storageService.validateNumberOfDifferentMediaTypes(files);

    return await this.tweetsService.createTweet(authUser, body, files);
  }

  @Delete('/:tweetId')
  async deleteTweet(@AuthUser() user: User, @Param('tweetId', ParseIntPipe) tweetId: number): Promise<void> {
    return this.tweetsService.deleteTweet(user, tweetId);
  }
}