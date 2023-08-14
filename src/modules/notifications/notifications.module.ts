import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../users/users.module";
import { TweetsModule } from "../tweets/tweets.module";
import { LikesModule } from "../likes/likes.module";
import { RedisModule } from "../redis/redis.module";
import { Notification } from "./notification.entity";
import { User } from "../users/entities/user.entity";
import { NotificationsEventsService } from "./notifications.listener";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { redisOptions } from "@/config/options";

@Module({
  imports: [
    RedisModule.registerAsync(redisOptions),
    UsersModule, 
    TweetsModule, 
    LikesModule,
    TypeOrmModule.forFeature([Notification, User])
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsEventsService]
})
export class NotificationsModule {}