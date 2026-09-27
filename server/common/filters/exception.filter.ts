import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { BusinessException } from '../interfaces/exception.interface';
import { HTTP_STATUS_TO_RESPONSE_CODE_MAP, ResponseCode } from '../constants/api_response_code';
import { ApiErrorResponse } from '../interfaces/api_response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    if (response.headersSent) return;
    let errorResponse: Omit<ApiErrorResponse, 'httpStatus'>;
    let httpStatus: HttpStatus;
    if (exception instanceof BusinessException) {
      httpStatus = exception.httpStatus;
      errorResponse = { error: { code: exception.code, message: exception.message, details: exception.details, fieldErrors: exception.fieldErrors, timestamp: Date.now() } };
    } else if (exception instanceof HttpException) {
      httpStatus = exception.getStatus() as HttpStatus;
      const exceptionResponse = exception.getResponse();
      errorResponse = { error: { code: HTTP_STATUS_TO_RESPONSE_CODE_MAP[httpStatus], message: typeof exceptionResponse === 'string' ? exceptionResponse : exception.message, details: typeof exceptionResponse === 'object' ? JSON.stringify(exceptionResponse) : undefined, timestamp: Date.now() } };
    } else {
      httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = { error: { code: ResponseCode.INTERNAL_ERROR, message: '服务器内部错误', stack: (exception as Error).stack, timestamp: Date.now() } };
    }
    response.status(httpStatus).json(errorResponse);
  }
}
