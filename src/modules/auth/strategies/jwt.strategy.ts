import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { IJwtPayload } from "../interfaces/jwt.interface";
import { AuthService } from "../auth.service";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly cfg: ConfigService, private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(request: Request) => {
        return request.cookies.auth;
      }]),
      ignoreExpiration: false,
      secretOrKey: cfg.get<string>("JWT_SECRET")
    })
  }

  async validate(payload: IJwtPayload): Promise<boolean> {
    return await this.authService.validateUser(payload.id);
  }
}