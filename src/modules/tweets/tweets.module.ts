import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UsersModule } from "@/modules/users/users.module";
import { MediaModule } from "@/modules/media/media.module";

import { Like } from "@/modules/likes/entities/like.entity";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { Media } from "@/modules/media/entities/media.entity";
import { Notification } from "@/modules/notifications/notification.entity";
import { TweetsViews } from "@/modules/tweets/entities/tweetsViews.entity";

import { TweetsController } from "@/modules/tweets/controllers/tweets.controller";
import { TweetsService } from "@/modules/tweets/services/tweets.service";
import { StorageService } from "@/modules/media/services/storage.service";
import { MediaService } from "@/modules/media/services/media.service";
import { Bookmark } from "./entities/bookmark.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tweet, 
      Like, 
      Media, 
      Notification, 
      TweetsViews, 
      Bookmark
    ]),
    UsersModule,
    MediaModule,
  ],
  controllers: [TweetsController],
  providers: [TweetsService, StorageService, MediaService],
  exports: [TweetsService]
})
export class TweetsModule {}