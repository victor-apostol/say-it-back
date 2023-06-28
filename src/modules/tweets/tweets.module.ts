import { Module } from "@nestjs/common";
import { UsersModule } from "@/modules/users/users.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TweetsController } from "@/modules/tweets/controllers/tweets.controller";
import { TweetsService } from "@/modules/tweets/services/tweets.service";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { Like } from "typeorm";

@Module({
  imports: [
    TypeOrmModule.forFeature([Tweet, Like]),
    UsersModule
  ],
  controllers: [TweetsController],
  providers: [TweetsService],
  exports: []
})
export class TweetsModule {}