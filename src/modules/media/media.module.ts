import { Module } from "@nestjs/common";
import { MediaController } from "@/modules/media/controllers/media.controller";
import { StorageService } from "@/modules/media/services/storage.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Media } from "@/modules/media/entities/media.entitiy";
import { MediaService } from "./services/media.service";
import { Tweet } from "../tweets/entities/tweet.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Media, Tweet])
  ],
  controllers: [MediaController],
  providers: [StorageService, MediaService],
  exports: [StorageService, MediaService]
})
export class MediaModule {}