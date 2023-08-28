import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '@/modules/users/users.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { TweetsModule } from '@/modules/tweets/tweets.module';
import { MediaModule } from '@/modules/media/media.module';
import { LikesModule } from '@/modules/likes/likes.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { SearchModule } from '@/modules/elasticsearch/search.module';
import { configValidationSchema, typeormOptions } from '@/config/options';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true, 
      validationSchema: configValidationSchema,
      envFilePath: '.env'
    }),
    TypeOrmModule.forRootAsync(typeormOptions),
    UsersModule,
    AuthModule,
    TweetsModule,
    MediaModule,
    LikesModule,
    NotificationsModule,
    SearchModule,
    EventEmitterModule.forRoot()
  ],
})
export class AppModule {}
