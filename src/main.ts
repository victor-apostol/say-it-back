import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { validationPipeOptions } from './config/options';
import { AppModule } from './modules/app.module';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    session({
      secret: 'asdfasdfasdf',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 60000
      }
    })
  )
  app.use(passport.initialize());
  app.use(passport.session());

  app.enableCors({
    origin: [
      'http://localhost:3000'
    ]
  })
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
  app.setGlobalPrefix('/api');

  await app.listen(3001);
}
bootstrap();
