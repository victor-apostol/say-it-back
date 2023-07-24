import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { LikesController } from "@/modules/likes/controllers/likes.controller";
import { LikesService } from "@/modules/likes/services/likes.service";
import { Like } from "@/modules/likes/entities/like.entity";
import { RedisModule } from "../redis/redis.module";
import { redisOptions } from "@/config/options";

@Module({
  imports: [
    RedisModule.registerAsync(redisOptions),
    TypeOrmModule.forFeature([Like, Tweet])
  ],
  controllers: [LikesController],
  providers: [LikesService],
  exports: [LikesService]
})
export class LikesModule {}