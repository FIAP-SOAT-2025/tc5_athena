import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger/dist/swagger-module';
import { DocumentBuilder } from '@nestjs/swagger/dist/document-builder';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
  
  app.enableCors({
    origin: corsOrigins.length === 1 && corsOrigins[0] === '*' ? true : corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  app.useGlobalPipes(
    new ValidationPipe(),
  );  
   const config = new DocumentBuilder()
    .setTitle('Athena Process Videos API')
    .setDescription('API for processing videos in Athena')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('athena', app, documentFactory);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
