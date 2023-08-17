import { AppModule } from './modules/app.module';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { validationPipeOptions } from './config/options';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://192.168.59.101',
      'http://192.168.59.100',
      'http://frontend-service',
    ],
    credentials: true
  })
  
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
  app.setGlobalPrefix('/api');

  await app.listen(7777);
}
bootstrap();
