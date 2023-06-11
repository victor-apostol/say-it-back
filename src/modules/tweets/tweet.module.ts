import { Module } from "@nestjs/common";
import { UserModule } from "../users/user.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TweetsController } from "./controllers/tweets.controller";
import { TweetsService } from "./services/tweets.service";
import { Tweet } from "./entities/tweet.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Tweet]),
    UserModule
  ],
  controllers: [TweetsController],
  providers: [TweetsService],
  exports: []
})
export class TweetModule {}