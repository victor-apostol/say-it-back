import { 
  Controller, 
  Get, 
  Put, 
  Post, 
  Body, 
  Param, 
  ParseFilePipe, 
  ParseIntPipe, 
  UploadedFiles, 
  UseGuards, 
  UseInterceptors 
} from "@nestjs/common";
import { JwtGuard } from "src/modules/auth/guards/auth.guard";
import { usersPath } from "../constants";
import { UsersService } from "../services/users.service";
import { AuthUser } from "@/utils/decorators/authUser.decorator";
import { ActionsDto, FriendshipDto } from "../dto/friendship.dto";
import { User } from "../entities/user.entity";
import { UpdateProfileDto } from "../dto/updateProfile.dto";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { imageMaxSizeInKb, videoMaxSizeInKb } from "@/modules/media/constants";
import { IUpdateProfileResponse } from "../interfaces/updateProfileResponse.interface";
import { MultipleMediaValidator } from "@/modules/media/validators/multipleMedia.validator";

@UseGuards(JwtGuard)
@Controller(usersPath)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("/follows-recomandation")
  async followsRecomandation(@AuthUser() user: User): Promise<Array<User>> {
    return await this.usersService.followsRecomandation(user);
  }

  @Get("/:id")
  async userProfileInfo(
    @AuthUser() user: User,
    @Param('id', ParseIntPipe) id: number
  ): Promise<{user: User, followingsCount: number, followersCount: number, amIfollowing?: boolean }> {
    return await this.usersService.getUserProfileInfo(id, user); 
  }

  @Post('/friendship/:action')
  async friendshipAction(@AuthUser() user: User, @Body() body: FriendshipDto, @Param() params: ActionsDto): Promise<void> {
    return await this.usersService.friendshipAction(user, body.targetUserId, params.action); 
  }

  @Put("/:id")
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
            imageMaxSize: imageMaxSizeInKb,
            videoMaxSize: videoMaxSizeInKb
          })
        ],
      })
    ) files: { newAvatar?: Express.Multer.File, newBackground?: Express.Multer.File }
  ): Promise<IUpdateProfileResponse> {
    return await this.usersService.updateProfile(user, body, files);
  }
}