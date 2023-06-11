import { BadRequestException, ClassSerializerInterceptor, Controller, Get, Param, ParseIntPipe, UseGuards, UseInterceptors } from "@nestjs/common";
import { JwtGuard } from "src/modules/auth/guards/auth.guard";
import { usersPath } from "../constants";
import { UserService } from "../services/user.service";

@UseGuards(JwtGuard)
@Controller(usersPath)
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get(":id")
  async secret(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findUser(id);

    if (!user) throw new BadRequestException('user not found');

    return user;
  }
}