import { 
  Controller, 
  Get, 
  Put, 
  Post, 
  Body, 
  Param, 
  ParseFilePipe, 
  UploadedFiles, 
  UseGuards, 
  UseInterceptors, 
  Query,
} from "@nestjs/common";
import { JwtGuard } from "src/modules/auth/guards/auth.guard";
import { usersPath } from "../constants";
import { UsersService } from "../services/users.service";
import { AuthUser } from "@/utils/decorators/authUser.decorator";
import { ActionsDto, FriendshipDto } from "../dto/friendship.dto";
import { User } from "../entities/user.entity";
import { UpdateProfileDto } from "../dto/updateProfile.dto";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { imageExtensionsWhitelist, imageMaxSizeInBytes, } from "@/modules/media/constants";
import { IUpdateProfileResponse } from "../interfaces/updateProfileResponse.interface";
import { MultipleMediaValidator } from "@/modules/media/validators/multipleMedia.validator";
import { SearchUsersDto } from "../dto/searchUsers.dto";
import { PaginationDto } from "@/utils/global/pagination.dto";
import { GetFollowersDto } from "../dto/getFollowers.dto";

@UseGuards(JwtGuard)
@Controller(usersPath)
export class UsersController {
constructor(private readonly usersService: UsersService) {}

  @Get("/follows-recomandation")
  async followsRecomandation(@AuthUser() user: User): Promise<Array<User>> {
    return await this.usersService.followsRecomandation(user);
  }

  @Get("/search-users")
  async searchUsers(@Query() query: SearchUsersDto): Promise<Array<User>> {
    return await this.usersService.searchUsers(query.query, query.page, query.size);
  }

  @Get("/:targetUsername/followers")
  async getFollowers(
    @AuthUser() user: User, 
    @Param() params: GetFollowersDto , 
    @Query() query: PaginationDto
  ): Promise<{ followers: Array<Omit<User, "appendS3BucketName"> & { amIfollowing: boolean }>, hasMore: boolean }> {
    return this.usersService.getFollowers(user, params.targetUsername, query.offset, query.take);
  }

  @Get("/:targetUsername/followings")
  async getFollowings(
    @AuthUser() user: User, 
    @Param() params: GetFollowersDto , 
    @Query() query: PaginationDto
  ): Promise<{ followings: Array<Omit<User, "appendS3BucketName"> & { amIfollowing: boolean }>, hasMore: boolean }> {
    return this.usersService.getFollowings(user, params.targetUsername, query.offset, query.take);
  }

  @Get("/:username")
  async userProfileInfo(
    @AuthUser() user: User,
    @Param('username') targetUsername: string
  ): Promise<{ user: User, followingsCount: number, followersCount: number, amIfollowing?: boolean }> {
    return await this.usersService.getUserProfileInfo(targetUsername, user); 
  }

  @Post("/friendship/:action")
  async friendshipAction(@AuthUser() user: User, @Body() body: FriendshipDto, @Param() params: ActionsDto): Promise<void> {
    return await this.usersService.friendshipAction(user, body.targetUserId, params.action); 
  }

  @Put("")
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'newAvatar', maxCount: 1 },
      { name: 'newBackground', maxCount: 1 },
    ])
  )
  async updateProfile(
    @AuthUser() user: User, 
    @Body() body: UpdateProfileDto,
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MultipleMediaValidator({ 
            whitelist: [{
              allowedExtensions: imageExtensionsWhitelist,
              mimeTypeMaxAllowedSizeBytes: imageMaxSizeInBytes
            }]
          })
        ],
      })
    ) files: { newAvatar?: Express.Multer.File, newBackground?: Express.Multer.File }
  ): Promise<IUpdateProfileResponse> {
    return await this.usersService.updateProfile(user, body, files);
  }
}