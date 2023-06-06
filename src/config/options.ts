import { Post } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModuleAsyncOptions } from "@nestjs/jwt";
import { TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";
import { User } from "src/modules/users/entities/user.entity";

export const typeormOptions: TypeOrmModuleAsyncOptions = {
  useFactory: async (cfg: ConfigService) => ({
    type: cfg.getOrThrow<"postgres" | "mysql">("DB_TYPE"),
    host: cfg.getOrThrow<string>("DB_HOST"),
    port: cfg.getOrThrow<number>("DB_PORT"),
    username: cfg.getOrThrow<string>("DB_USERNAME"),
    password: cfg.getOrThrow<string>("DB_PASSWORD"),
    database: cfg.getOrThrow<string>("DB_NAME"),
    entities: [User, Post]
  }),
  inject: [ConfigService]
}

export const jwtOptions: JwtModuleAsyncOptions = {
  useFactory: async (cfg: ConfigService) => ({
    global: true,
    secret: cfg.getOrThrow<string>("JWT_SECRET"),
    signOptions: { expiresIn: '360000'}
  }),
  inject: [ConfigService]
}

export const validationPipeOptions = {
  forbidNonWhitelisted: true,
  whitelist: true,
}