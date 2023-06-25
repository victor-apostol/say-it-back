import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '@/modules/users/user.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { TweetModule } from '@/modules/tweets/tweet.module';
import { MediaModule } from '@/modules/media/media.module';
import { LikeModule } from '@/modules/likes/like.module';
import { configValidationSchema, typeormOptions } from '@/config/options';
import { CommentModule } from '@/modules/comments/comment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true, 
      validationSchema: configValidationSchema 
    }),
    TypeOrmModule.forRootAsync(typeormOptions),
    UserModule,
    AuthModule,
    TweetModule,
    MediaModule,
    LikeModule,
    CommentModule
  ],
})
export class AppModule {}
