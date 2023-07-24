import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "@/modules/users/users.module";
import { MediaModule } from "../media/media.module";
import { Like } from "@/modules/likes/entities/like.entity";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { Media } from "@/modules/media/entities/media.entitiy";
import { User } from "@/modules/users/entities/user.entity";
import { TweetsController } from "@/modules/tweets/controllers/tweets.controller";
import { TweetsService } from "@/modules/tweets/services/tweets.service";
import { StorageService } from "@/modules/media/services/storage.service";
import { MediaService } from "@/modules/media/services/media.service";
import { Notification } from "../notifications/notification.entity";
import { RedisModule } from "../redis/redis.module";
import { redisOptions } from "@/config/options";

@Module({
  imports: [
    TypeOrmModule.forFeature([Tweet, Like, Media, User, Notification]),
    RedisModule.registerAsync(redisOptions),
    UsersModule,
    MediaModule
  ],
  controllers: [TweetsController],
  providers: [TweetsService, StorageService, MediaService],
  exports: [TweetsService]
})
export class TweetsModule {}