import { Body, Controller, Get, Post, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { Response } from "express";
import { OAuthGuard } from "./guards/oauth2.guard";
import { IJwtPayload } from "./interfaces/jwt.interface";
import { AuthUser } from "src/utils/decorators/authUser.decorator";
import { ConfigService } from "@nestjs/config";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) {}

  @Post('register')
  async register(@Body() body: RegisterDto, @Res() response: Response): Promise<void> {
    const generatedToken = await this.authService.register(body);

    response.cookie('auth', generatedToken, {
      maxAge: 24 * 60 * 60 * 1000, 
      httpOnly: true, 
    });
    
    response.redirect(`${this.configService.get("CLIENT_URL")}/feed`);
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Res() response: Response): Promise<void> {
    const generatedToken = await this.authService.login(body);

    response.cookie('auth', generatedToken, {
      maxAge: 24 * 60 * 60 * 1000, 
      httpOnly: true, 
    });
    
    response.send('success');
  }

  @UseGuards(OAuthGuard) 
  @Get("google")
  google(): string {
    return 'success';
  }

  @UseGuards(OAuthGuard) 
  @Get('redirect') 
  async redirect(@AuthUser() user: IJwtPayload, @Res() response: Response): Promise<void> {
    const generatedToken = this.authService._generateToken({
      email: user.email, 
      id: user.id
    }); 

    response.cookie('auth', generatedToken, {
      maxAge: 24 * 60 * 60 * 1000, 
      httpOnly: true, 
    });
    
    response.send('success');
  }
}