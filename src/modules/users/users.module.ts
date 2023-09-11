import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MediaModule } from "@/modules/media/media.module";
import { SearchModule } from "@/modules/elasticsearch/search.module";
import { User } from "./entities/user.entity";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { Notification } from "@/modules/notifications/notification.entity";
import { Bookmark } from "../tweets/entities/bookmark.entity";
import { UsersController } from "./controllers/users.controller";
import { UsersService } from "./services/users.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tweet, Notification, Bookmark]),
    MediaModule,
    SearchModule
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}