import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "@/modules/users/users.module";
import { MediaModule } from "../media/media.module";
import { Like } from "@/modules/likes/entities/like.entity";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { Media } from "@/modules/media/entities/media.entity";
import { TweetsController } from "@/modules/tweets/controllers/tweets.controller";
import { TweetsService } from "@/modules/tweets/services/tweets.service";
import { StorageService } from "@/modules/media/services/storage.service";
import { MediaService } from "@/modules/media/services/media.service";
import { Notification } from "../notifications/notification.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Tweet, Like, Media, Notification]),
    UsersModule,
    MediaModule
  ],
  controllers: [TweetsController],
  providers: [TweetsService, StorageService, MediaService],
  exports: [TweetsService]
})
export class TweetsModule {}