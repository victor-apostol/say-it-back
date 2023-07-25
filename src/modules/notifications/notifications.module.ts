import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { UsersModule } from "../users/users.module";
import { TweetsModule } from "../tweets/tweets.module";
import { LikesModule } from "../likes/likes.module";
import { NotificationsEventsService } from "./notifications.listener";
import { RedisModule } from "../redis/redis.module";
import { redisOptions } from "@/config/options";

@Module({
  imports: [
    RedisModule.registerAsync(redisOptions),
    UsersModule, 
    TweetsModule, 
    LikesModule
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsEventsService]
})
export class NotificationsModule {}