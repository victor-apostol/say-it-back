import { BadRequestException, Body, Controller, Get, Param, ParseBoolPipe, ParseIntPipe, Post, Query, UseGuards } from "@nestjs/common";
import { JwtGuard } from "src/modules/auth/guards/auth.guard";
import { usersPath } from "../constants";
import { UsersService } from "../services/users.service";
import { AuthUser } from "@/utils/decorators/authUser.decorator";
import { ActionsDto, FriendshipDto } from "../dto/friendship.dto";
import { User } from "../entities/user.entity";
import { IGetFriendShipFollowers, IGetFriendShipFollowing, IGetFriendShipsCount } from "../interfaces/friendship.interface";

@UseGuards(JwtGuard)
@Controller(usersPath)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(":id")
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
}