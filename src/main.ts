import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BullBoardSetup } from './video/gateways/queue/queue.monitoring';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  BullBoardSetup.configure(app);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
