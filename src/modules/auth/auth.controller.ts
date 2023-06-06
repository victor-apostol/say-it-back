import { Body, Controller, Get, Post, Res, UseGuards } from "@nestjs/common";
import { JwtGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { Response } from "express";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto): Promise<void> {
    return await this.authService.register(body);
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

  @UseGuards(JwtGuard)
  @Get('status')
  async test() {
    return 'win';
  }
}