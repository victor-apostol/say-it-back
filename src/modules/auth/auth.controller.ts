import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { Request, Response } from "express";
import { JwtGuard } from "./guards/auth.guard";
import { OAuthGuard } from "./guards/oauth2.guard";
import { IJwtPayload } from "./interfaces/jwt.interface";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto, @Res() response: Response): Promise<void> {
    const generatedToken = await this.authService.register(body);

    response.cookie('auth', generatedToken, {
      maxAge: 24 * 60 * 60 * 1000, 
      httpOnly: true, 
    });
    
    response.send('success');
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
  async redirect(@Req() req: Request, @Res() response: Response): Promise<void> {
    const serializedUser = req.user as IJwtPayload;
    const generatedToken = this.authService._generateToken({
      email: serializedUser.email, 
      id: serializedUser.id
    }); 

    response.cookie('auth', generatedToken, {
      maxAge: 24 * 60 * 60 * 1000, 
      httpOnly: true, 
    });
    
    response.send('success');
  }
}