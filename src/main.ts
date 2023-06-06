import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { validationPipeOptions } from './config/options';
import { AppModule } from './modules/app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
  app.setGlobalPrefix('/api');

  await app.listen(3001);
}
bootstrap();
