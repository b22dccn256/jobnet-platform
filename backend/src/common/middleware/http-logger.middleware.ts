import { Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const httpLogger = new Logger('HTTP');

/** Logs every incoming HTTP request and its completion status/latency. */
export function httpLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const { method, originalUrl } = req;
  const start = process.hrtime.bigint();

  httpLogger.log(`--> ${method} ${originalUrl}`);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const status = res.statusCode;
    const msg = `<-- ${method} ${originalUrl} ${status} (${durationMs.toFixed(1)}ms)`;
    if (status >= 500) {
      httpLogger.error(msg);
    } else if (status >= 400) {
      httpLogger.warn(msg);
    } else {
      httpLogger.log(msg);
    }
  });

  res.on('close', () => {
    if (!res.writableFinished) {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      httpLogger.warn(`<-- ${method} ${originalUrl} ABORTED (${durationMs.toFixed(1)}ms)`);
    }
  });

  next();
}
