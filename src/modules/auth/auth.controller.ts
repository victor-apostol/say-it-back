import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "@/modules/auth/auth.service";
import { RegisterDto } from "@/modules/auth/dto/register.dto";
import { LoginDto } from "@/modules/auth/dto/login.dto";
import { IJwtPayload } from "@/modules/auth/interfaces/jwt.interface";
import { AuthUser } from "@/utils/decorators/authUser.decorator";
import { JwtGuard } from "@/modules/auth/guards/auth.guard";
import { oAuthDto } from "./dto/oauth.dto";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtGuard)
  @Get('info')
  async getAuthInfo(@AuthUser() user: IJwtPayload): Promise<IJwtPayload> {
    console.log('requested')
    return user;
  }
  
  @Post('register')
  async register(@Body() body: RegisterDto): Promise<string> {
    return await this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto): Promise<{ token: string }> {
    return { token: await this.authService.login(body) };
  }

  @Post('/oauth')
  async oauth(@Body() body: oAuthDto): Promise<{ token: string }> {
    return { token: await this.authService.oauth(body) };
  }
}