import { Module } from '@nestjs/common';
import { VideoModule } from './video/video.module';
import { UsersModule } from './users/users.model';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { StorageModule } from './storage/storage.module';
@Module({
  imports: [ConfigModule.forRoot(),VideoModule, UsersModule, StorageModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
