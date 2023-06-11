import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './users/entities/user.entity';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { configValidationSchema, typeormOptions } from './../config/options';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: configValidationSchema }),
    PassportModule.register({ session: true }),
    TypeOrmModule.forRootAsync(typeormOptions),
    TypeOrmModule.forFeature([User]),
    UserModule,
    AuthModule
  ],
})
export class AppModule {}
