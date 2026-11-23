import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

/** Translate Mongoose/MongoDB driver errors into clear 4xx HTTP responses. */
@Catch()
export class MongoExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const err = exception as {
      code?: number;
      name?: string;
      keyPattern?: Record<string, unknown>;
      message?: string;
    };
    const response = host.switchToHttp().getResponse();

    if (err?.code === 11000) {
      const fields = err.keyPattern ? Object.keys(err.keyPattern).join(', ') : 'dữ liệu';
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: `Giá trị của ${fields} đã tồn tại`,
      });
    }

    if (err?.name === 'CastError' || err?.name === 'ValidationError') {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: err.message || 'Dữ liệu đầu vào không hợp lệ',
      });
    }

    return super.catch(exception, host);
  }
}
