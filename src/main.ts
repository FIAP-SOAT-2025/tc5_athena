import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BullBoardSetup } from './video/gateways/queue/queue.monitoring';
import { SwaggerModule } from '@nestjs/swagger/dist/swagger-module';
import { DocumentBuilder } from '@nestjs/swagger/dist/document-builder';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  BullBoardSetup.configure(app);
   const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('athena', app, documentFactory);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
