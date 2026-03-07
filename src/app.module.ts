import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { VideoModule } from './video/video.module';
import { UsersModule } from './users/users.model';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { StorageModule } from './storage/storage.module';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { AuthModule } from './auth/auth.module';
import { MetricsMiddleware } from './metrics/prometheus.middleware';
import { HealthModule } from './health/health.module';
import { AuthController } from './auth/gateways/controller/auth.controller';
import { UserController } from './users/gateways/controllers/user.controller';
import { VideoController } from './video/gateways/controllers/video.controller';

@Module({
  imports: [
    PrometheusModule.register(),
    VideoModule,
    UsersModule,
    StorageModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total de requisições HTTP recebidas',
      labelNames: ['method', 'route', 'status_code'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'Duração das requisições HTTP em segundos',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    }),
    MetricsMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MetricsMiddleware)
      .forRoutes(AuthController, UserController, VideoController);
  }
}
