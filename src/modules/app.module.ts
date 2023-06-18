import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { configValidationSchema, typeormOptions } from './../config/options';
import { PassportModule } from '@nestjs/passport';
import { TweetModule } from './tweets/tweet.module';
import { MediaModule } from './media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: configValidationSchema }),
    PassportModule.register({ session: true }),
    TypeOrmModule.forRootAsync(typeormOptions),
    UserModule,
    AuthModule,
    TweetModule,
    MediaModule
  ],
})
export class AppModule {}
