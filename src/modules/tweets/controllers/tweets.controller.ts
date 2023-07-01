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
import { IPaginatedTweets } from "../interfaces/paginate_tweets.interface";
import { FilesInterceptor } from "@nestjs/platform-express";
import { fileMaxSizeInKb, maxFilesCount } from "@/modules/media/constants";
import { MediaValidator } from "@/modules/media/validators/media.validator";

@UseGuards(JwtGuard)
@Controller(tweetsPath)
export class TweetsController {
  constructor(private readonly tweetsService: TweetsService) {}

  @Get('user/:userId')
  async getUserTweets(@Param('userId', ParseIntPipe) userId: number, @Query() query: TweetPaginationDto): Promise<IPaginatedTweets> {
    return await this.tweetsService.getUserTweets(userId, query.offset, query.count);
  }

  @Get(':id')
  async getTweet(@Param('id', ParseIntPipe) id: number): Promise<Tweet | null> {
    return await this.tweetsService.getTweet(id);
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