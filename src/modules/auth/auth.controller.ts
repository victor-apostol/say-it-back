import { Body, Controller, Get, Post, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { Response } from "express";
import { IJwtPayload } from "./interfaces/jwt.interface";
import { AuthUser } from "src/utils/decorators/authUser.decorator";
import { ConfigService } from "@nestjs/config";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) {}

  @Post('register')
  async register(@Body() body: RegisterDto): Promise<string> {
    return await this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto): Promise<string> {
    return await this.authService.login(body);
  }

  // @UseGuards(OAuthGuard) 
  // @Get("google")
  // google(): string {
  //   return 'success';
  // }

//   @UseGuards(OAuthGuard) 
//   @Get('redirect') 
//   async redirect(@AuthUser() user: IJwtPayload): Promise<void> {
//     return this.authService._generateToken({
//       email: user.email, 
//       id: user.id
//     }); 
//   }
}