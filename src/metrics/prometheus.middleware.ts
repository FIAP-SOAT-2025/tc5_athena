import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly requestCounter: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<string>,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
      const method = req.method;
      const route = (req.route?.path as string | undefined) ?? req.path;
      const statusCode = String(res.statusCode);
      const duration = Number(process.hrtime.bigint() - startTime) / 1e9;

      this.requestCounter.inc({ method, route, status_code: statusCode });
      this.requestDuration.observe(
        { method, route, status_code: statusCode },
        duration,
      );
    });

    next();
  }
}
