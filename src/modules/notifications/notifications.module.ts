import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { UsersModule } from "../users/users.module";
import { TweetsModule } from "../tweets/tweets.module";
import { LikesModule } from "../likes/likes.module";

@Module({
  imports: [UsersModule, TweetsModule, LikesModule],
  controllers: [NotificationsController],
  providers: [NotificationsService]
})
export class NotificationsModule {}