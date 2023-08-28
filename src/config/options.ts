import { ConfigService } from "@nestjs/config";
import { JwtModuleAsyncOptions } from "@nestjs/jwt";
import { TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { User } from "@/modules/users/entities/user.entity";
import { Like } from "@/modules/likes/entities/like.entity";
import { Tweet } from "src/modules/tweets/entities/tweet.entity";
import { Media } from "src/modules/media/entities/media.entity";
import { Notification } from "@/modules/notifications/notification.entity";
//import { LikeEventSubscriber } from "@/modules/likes/entities/like.event.subscriber";
import * as Joi from 'joi';
import { RedisAsyncModuleOptions } from "@/modules/redis/redis.types";
import { ElasticsearchModuleAsyncOptions } from "@nestjs/elasticsearch";

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

export const redisOptions: RedisAsyncModuleOptions = {
  useFactory: async (configService: ConfigService) => ({
    connectionOptions: {
      host: configService.get<string>('REDIS_HOST'),
      port: configService.get<number>('REDIS_PORT'),
    },
    onClientReady: (client) => {
      client.on('error', (err) => {
        console.log('Redis Client Error: ', err);
      });

      client.on('connect', () => {
        console.log(`Connected to redis on ${client.options.host}:${client.options.port}`);
      });
    },
  }),
  inject: [ConfigService]
}

export const elasticOptions: ElasticsearchModuleAsyncOptions = {
  useFactory: async (configService: ConfigService) => ({
    node: configService.get<string>("ELASTICSEARCH_NODE"),
    tls: { rejectUnauthorized: false },
    maxRetries: 10,
    requestTimeout: 60000,
    pingTimeout: 60000,
    auth: {
      username: configService.getOrThrow<string>("ELASTICSEARCH_USERNAME"),
      password: configService.getOrThrow<string>("ELASTICSEARCH_PASSWORD")
    }
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

  ELASTICSEARCH_NODE: Joi.string().required(),
  ELASTICSEARCH_USERNAME: Joi.string().required(),
  ELASTICSEARCH_PASSWORD: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRY: Joi.number().required(),

  SALT: Joi.number().required(),

  CLIENT_URL: Joi.string().required(),

  AWS_S3_REGION: Joi.string().required(),
  AWS_S3_BUCKET: Joi.string().required(),
  AWS_ACCESS_KEY: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_RETRY_TIMES: Joi.number().required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),

  DEFAULT_BACKGROUND_IMAGE: Joi.string().required(),
  DEFAULT_AVATAR_IMAGE: Joi.string().required()
});

export const validationPipeOptions = {
  forbidNonWhitelisted: true,
  whitelist: true,
  transform: true
}