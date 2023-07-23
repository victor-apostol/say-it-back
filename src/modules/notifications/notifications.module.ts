import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { UsersModule } from "../users/users.module";
import { TweetsModule } from "../tweets/tweets.module";

@Module({
  imports: [UsersModule, TweetsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService]
})
export class NotificationsModule {}