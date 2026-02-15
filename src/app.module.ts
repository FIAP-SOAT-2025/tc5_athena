import { Module } from '@nestjs/common';
import { VideoModule } from './video/video.module';
import { UsersModule } from './users/users.model';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [VideoModule, UsersModule, StorageModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
