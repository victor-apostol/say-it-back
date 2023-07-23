import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service";
import { IJwtPayload } from "../interfaces/jwt.interface";
import { User } from "@/modules/users/entities/user.entity";

@Injectable() 
export class SseStrategy extends PassportStrategy(Strategy, 'see_strategy') {
  constructor(private readonly cfg: ConfigService, private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          return request?.cookies?.auth; // Extract the JWT token from the 'jwt' cookie
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: cfg.get<string>("JWT_SECRET")
    })
  }

  async validate(payload: IJwtPayload): Promise<Omit<User, 'password'> | null> {
    return await this.authService.validateUser(payload.id);
  }
}