import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { LikesController } from "@/modules/likes/controllers/likes.controller";
import { LikesService } from "@/modules/likes/services/likes.service";
import { Like } from "@/modules/likes/entities/like.entity";
import { Notification } from "@/modules/notifications/notification.entity";
import { User } from "@/modules/users/entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Like, Tweet, Notification, User]),
  ],
  controllers: [LikesController],
  providers: [LikesService],
  exports: [LikesService]
})
export class LikesModule {}