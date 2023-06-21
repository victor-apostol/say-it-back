import { Module } from "@nestjs/common";
import { MediaController } from "@/modules/media/controllers/media.controller";
import { StorageService } from "@/modules/media/services/storage.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Media } from "@/modules/media/entities/media.entitiy";

@Module({
  imports: [
    TypeOrmModule.forFeature([Media])
  ],
  controllers: [MediaController],
  providers: [StorageService],
  exports: []
})
export class MediaModule {}