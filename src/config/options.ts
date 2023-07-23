import { ConfigService } from "@nestjs/config";
import { JwtModuleAsyncOptions } from "@nestjs/jwt";
import { TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { User } from "@/modules/users/entities/user.entity";
import { Like } from "@/modules/likes/entities/like.entity";
import { Tweet } from "src/modules/tweets/entities/tweet.entity";
import { Media } from "src/modules/media/entities/media.entitiy";
import { Notification } from "@/modules/notifications/notification.entity";
//import { LikeEventSubscriber } from "@/modules/likes/entities/like.event.subscriber";
import * as Joi from 'joi';

export const entitiesToLoad = [
  User, Tweet, Media, Like, Notification
]

export const typeormOptions: TypeOrmModuleAsyncOptions = {
  useFactory: async (cfg: ConfigService): Promise<PostgresConnectionOptions> => ({
    type: cfg.getOrThrow<"postgres">("DB_TYPE"),
    host: cfg.get("DB_HOST"),
    port: cfg.get("DB_PORT"),
    username: cfg.get("DB_USERNAME"),
    password: cfg.get("DB_PASSWORD"),
    database: cfg.get("DB_NAME"),
    entities: entitiesToLoad,
    //subscribers: [LikeEventSubscriber],
  }),
  inject: [ConfigService]
}

export const jwtOptions: JwtModuleAsyncOptions = {
  useFactory: async (cfg: ConfigService) => ({
    global: true,
    secret: cfg.get<string>("JWT_SECRET"),
    signOptions: { expiresIn: cfg.get<string>("JWT_EXPIRY")}
  }),
  inject: [ConfigService]
}

export const configValidationSchema = Joi.object({
  DB_TYPE: Joi.string().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_NAME: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  SALT: Joi.number().required(),

  CLIENT_URL: Joi.string().required(),

  AWS_S3_REGION: Joi.string().required(),
  AWS_S3_BUCKET: Joi.string().required(),
  AWS_ACCESS_KEY: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_RETRY_TIMES: Joi.number().required()
});

export const validationPipeOptions = {
  forbidNonWhitelisted: true,
  whitelist: true,
  transform: true
}