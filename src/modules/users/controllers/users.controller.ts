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

  @Get('/friendships/count/:targetUserId')
  async getFriendshipsCount(@Param('targetUserId', ParseIntPipe) targetUserId: number): Promise<IGetFriendShipsCount> {
    return this.usersService.getFriendshipsCount(targetUserId);
  }

  // @Get('/friendships/following')
  // async getFriendshipsFollowing(@AuthUser() user: User): Promise<IGetFriendShipFollowing> {
  //   return this.usersService.getFriendshipsFollowing(user);
  // }

  // @Get('/friendships/followers')
  // async getFriendshipsFollowers(@AuthUser() user: User): Promise<IGetFriendShipFollowers> {
  //   return this.usersService.getFriendshipsFollowers(user);
  // }

  @Get(":id")
  async userProfileInfo(@AuthUser() authUser: User, @Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.usersService.findUser(id, authUser);

    if (!user) throw new BadRequestException('user not found');
    
    return user; 
  }

  @Post('/friendship/:action')
  async friendshipAction(@AuthUser() user: User, @Body() body: FriendshipDto, @Param() params: ActionsDto): Promise<void> {
    return await this.usersService.friendshipAction(user, body.targetUserId, params.action); 
  }
}