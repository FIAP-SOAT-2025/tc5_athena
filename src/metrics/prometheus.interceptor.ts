import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class PrometheusInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly requestCounter: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method: string = request.method;
    const route: string = request.route?.path ?? request.url;
    const startTime = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = String(response.statusCode);
          const duration = Number(process.hrtime.bigint() - startTime) / 1e9;

          this.requestCounter.inc({ method, route, status_code: statusCode });
          this.requestDuration.observe(
            { method, route, status_code: statusCode },
            duration,
          );
        },
        error: (error: { status?: number }) => {
          const statusCode = String(error.status ?? 500);
          const duration = Number(process.hrtime.bigint() - startTime) / 1e9;

          this.requestCounter.inc({ method, route, status_code: statusCode });
          this.requestDuration.observe(
            { method, route, status_code: statusCode },
            duration,
          );
        },
      }),
    );
  }
}
