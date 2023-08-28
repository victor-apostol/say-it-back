import { Module } from "@nestjs/common";
import { UsersController } from "./controllers/users.controller";
import { UsersService } from "./services/users.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { Notification } from "@/modules/notifications/notification.entity";
import { MediaModule } from "@/modules/media/media.module";
import { SearchModule } from "@/modules/elasticsearch/search.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tweet, Notification]),
    MediaModule,
    SearchModule
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}