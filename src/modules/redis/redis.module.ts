import { DynamicModule, Module } from "@nestjs/common";
import IORedis from 'ioredis';
import { IORedisKey, RedisAsyncModuleOptions } from "./redis.types";

@Module({})
export class RedisModule {
  static async registerAsync({ useFactory, imports, inject }: RedisAsyncModuleOptions): Promise<DynamicModule> {
    const redisProvider = {
      provide: IORedisKey,
      useFactory: async (...args: Array<any>) => {
        const { connectionOptions, onClientReady } = await useFactory(...args);

        const client = new IORedis(connectionOptions);

        onClientReady(client);

        return client;
      },
      inject
    }

    return {
      module: RedisModule,
      providers: [redisProvider],
      exports: [redisProvider],
      imports,
    }
  }
}