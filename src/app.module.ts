import { Module } from '@nestjs/common';
import { VideoModule } from './video/video.module';
import { UsersModule } from './users/users.model';

@Module({
  imports: [VideoModule, UsersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
