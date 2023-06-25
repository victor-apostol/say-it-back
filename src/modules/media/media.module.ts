import { Module } from "@nestjs/common";
import { MediaController } from "@/modules/media/controllers/media.controller";
import { StorageService } from "@/modules/media/services/storage.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Media } from "@/modules/media/entities/media.entitiy";
import { MediaService } from "./services/media.service";
import { User } from "../users/entities/user.entity";
import { Tweet } from "../tweets/entities/tweet.entity";
import { Comment } from "../comments/entitites/comment.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Media, User, Tweet, Comment])
  ],
  controllers: [MediaController],
  providers: [StorageService, MediaService],
  exports: []
})
export class MediaModule {}