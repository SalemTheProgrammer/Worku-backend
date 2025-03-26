import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import logger from '../utils/logger';

interface ErrorResponse {
  name?: string;
  message?: string;
  error?: any;
  stack?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorData: ErrorResponse | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      message = typeof errorResponse === 'string' 
        ? errorResponse 
        : (errorResponse as any).message || exception.message;
      errorData = {
        error: (errorResponse as any).error,
      };
    } else if (exception instanceof Error) {
      message = exception.message;
      errorData = {
        name: exception.name,
        stack: process.env.NODE_ENV === 'development' ? exception.stack : undefined,
      };
    }

    // Log the error
    logger.error(`${request.method} ${request.url}`, {
      status,
      message,
      error: errorData,
      body: request.body,
      params: request.params,
      query: request.query,
      stack: errorData?.stack,
    });

    response.status(status).json({
      statusCode: status,
      message,
      error: errorData,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}