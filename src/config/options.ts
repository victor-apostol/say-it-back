import { ConfigService } from "@nestjs/config";
import { JwtModuleAsyncOptions } from "@nestjs/jwt";
import { TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";
import { User } from "src/modules/users/entities/user.entity";
import * as Joi from 'joi';
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { Tweet } from "src/modules/tweets/entities/tweet.entity";

export const typeormOptions: TypeOrmModuleAsyncOptions = {
  useFactory: async (cfg: ConfigService): Promise<PostgresConnectionOptions> => ({
    type: cfg.getOrThrow<"postgres">("DB_TYPE"),
    host: cfg.get("DB_HOST"),
    port: cfg.get("DB_PORT"),
    username: cfg.get("DB_USERNAME"),
    password: cfg.get("DB_PASSWORD"),
    database: cfg.get("DB_NAME"),
    entities: [User, Tweet]
  }),
  inject: [ConfigService]
}

export const jwtOptions: JwtModuleAsyncOptions = {
  useFactory: async (cfg: ConfigService) => ({
    global: true,
    secret: cfg.get<string>("JWT_SECRET"),
    signOptions: { expiresIn: '360000'}
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

  OAUTH2_CLIENT_ID: Joi.string().required(),
  OAUTH2_CLIENT_SECRET: Joi.string().required(),
  OAUTH2_CALLBACKURL: Joi.string().required(),

  CLIENT_URL: Joi.string().required()
});

export const validationPipeOptions = {
  forbidNonWhitelisted: true,
  whitelist: true,
}