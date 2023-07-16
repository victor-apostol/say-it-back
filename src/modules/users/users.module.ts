import { Module } from "@nestjs/common";
import { UsersController } from "./controllers/users.controller";
import { UsersService } from "./services/users.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Tweet } from "../tweets/entities/tweet.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tweet])
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}