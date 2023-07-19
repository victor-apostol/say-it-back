import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { validationPipeOptions } from './config/options';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001'
    ],
    credentials: true
  })
  
  app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
  app.setGlobalPrefix('/api');

  await app.listen(7777);
}
bootstrap();
