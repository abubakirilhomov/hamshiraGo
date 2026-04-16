import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/nestjs';
import { I18nService } from '../i18n/i18n.service';

@Catch()
export class I18nExceptionFilter extends BaseExceptionFilter {
  constructor(private readonly i18n: I18nService) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      // WebSocket or other — delegate to base
      return super.catch(exception, host);
    }

    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Report 5xx to Sentry
    if (status >= 500) {
      Sentry.captureException(exception);
    }

    if (!(exception instanceof HttpException)) {
      return super.catch(exception, host);
    }

    const lang = this.i18n.getLang(req);
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      // Simple string message
      const translated = this.i18n.t(exceptionResponse, lang);
      res.status(status).json({
        statusCode: status,
        message: translated,
      });
      return;
    }

    const body = exceptionResponse as Record<string, unknown>;
    const rawMessage = body.message;

    if (Array.isArray(rawMessage)) {
      // ValidationPipe errors — array of messages
      const translated = rawMessage.map((msg: string) => this.i18n.t(String(msg), lang));
      res.status(status).json({
        statusCode: status,
        message: translated,
        error: body.error,
      });
      return;
    }

    if (typeof rawMessage === 'string') {
      const translated = this.i18n.t(rawMessage, lang);
      res.status(status).json({
        statusCode: status,
        message: translated,
        error: body.error,
      });
      return;
    }

    // Fallback — pass through
    res.status(status).json(body);
  }
}
