import { AppModule } from './modules/app.module';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validationPipeOptions } from './config/options';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get<ConfigService>(ConfigService);
  const port = config.get<string>('APP_PORT', '7777');

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://nginx-service',
      'http://192.168.59.101',
      'http://192.168.59.100',
    ],
    credentials: true
  })
  
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
  app.setGlobalPrefix('/backend');

  await app.listen(port);
}
bootstrap();
