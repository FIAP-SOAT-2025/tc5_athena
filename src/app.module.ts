import { Module } from '@nestjs/common';
import { VideoModule } from './video/video.module';
import { UsersModule } from './users/users.model';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { StorageModule } from './storage/storage.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    PrometheusModule.register(),
    VideoModule,
    UsersModule,
    StorageModule,
    AuthModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
