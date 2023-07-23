import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { jwtOptions } from "./../../config/options";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { UsersModule } from "../users/users.module";
import { SseStrategy } from "./strategies/see.strategy";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync(jwtOptions),
    UsersModule,
  ],
  providers: [
    AuthService, 
    JwtStrategy, 
    SseStrategy
  ],
  controllers: [AuthController],
})
export class AuthModule {}