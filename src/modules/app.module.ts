import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '@/modules/users/users.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { TweetsModule } from '@/modules/tweets/tweets.module';
import { MediaModule } from '@/modules/media/media.module';
import { LikesModule } from '@/modules/likes/likes.module';
import { configValidationSchema, typeormOptions } from '@/config/options';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true, 
      validationSchema: configValidationSchema 
    }),
    TypeOrmModule.forRootAsync(typeormOptions),
    UsersModule,
    AuthModule,
    TweetsModule,
    MediaModule,
    LikesModule,
    NotificationsModule
  ],
})
export class AppModule {}
