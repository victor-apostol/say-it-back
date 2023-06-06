import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './users/entities/user.entity';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { typeormOptions } from './../config/options';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(typeormOptions),
    TypeOrmModule.forFeature([User]),
    UserModule,
    AuthModule
  ],
})
export class AppModule {}
