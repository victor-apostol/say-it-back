import { Body, Controller, Get, Post, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { Response } from "express";
import { IJwtPayload } from "./interfaces/jwt.interface";
import { AuthUser } from "src/utils/decorators/authUser.decorator";
import { ConfigService } from "@nestjs/config";
import { JwtGuard } from "./guards/auth.guard";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) {}

  @UseGuards(JwtGuard)
  @Get('info')
  async getAuthInfo(@AuthUser() user: IJwtPayload): Promise<IJwtPayload> {
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
}