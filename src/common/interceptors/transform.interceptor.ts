import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import logger from '../utils/logger';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const statusCode = response.statusCode || HttpStatus.OK;

    const startTime = Date.now();

    return next.handle().pipe(
      map(data => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const result = {
          statusCode,
          message: data?.message || 'Success',
          data: data?.data || data,
          timestamp: new Date().toISOString(),
        };

        // Log the request and response
        logger.info(`${request.method} ${request.url}`, {
          duration: `${duration}ms`,
          statusCode,
          requestBody: request.body,
          requestParams: request.params,
          requestQuery: request.query,
          responseData: result,
        });

        return result;
      }),
    );
  }
}