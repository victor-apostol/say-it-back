import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { AuthService } from "../auth.service";

@Injectable()
export class OAuthStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService, private readonly authService: AuthService) {
    super({
      clientID: configService.get<string>("OAUTH2_CLIENT_ID"),
      clientSecret: configService.get<string>("OAUTH2_CLIENT_SECRET"),
      callbackURL: configService.get<string>("OAUTH2_CALLBACKURL"),
      scope: ["email", "profile"]
    })
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<void> {
    const user = await this.authService.googleOAuthAuthorization(profile);

    done(null, user);
  }
}