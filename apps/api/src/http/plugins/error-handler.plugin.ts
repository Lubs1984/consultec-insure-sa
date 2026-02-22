import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import type { FastifyError } from 'fastify';

/**
 * Base class for all domain/application errors.
 * Controllers throw these and the error handler maps them to HTTP responses.
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;
  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly httpStatus = 400;
}

export class UnauthenticatedError extends AppError {
  readonly code = 'UNAUTHENTICATED';
  readonly httpStatus = 401;
}

export class ForbiddenError extends AppError {
  readonly code = 'FORBIDDEN';
  readonly httpStatus = 403;
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly httpStatus = 404;
  constructor(resource: string, id?: string) {
    super(id ? `${resource} with ID '${id}' not found` : `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  readonly code = 'CONFLICT';
  readonly httpStatus = 409;
}

export class RetentionViolationError extends AppError {
  readonly code = 'RETENTION_VIOLATION';
  readonly httpStatus = 409;
  constructor(retainUntil: Date) {
    super(
      `This record cannot be deleted until ${retainUntil.toISOString()} (FAIS 5-year retention requirement).`,
      { retainUntil },
    );
  }
}

export class StateMachineViolationError extends AppError {
  readonly code = 'STATE_MACHINE_VIOLATION';
  readonly httpStatus = 422;
  constructor(from: string, to: string, resource: string) {
    super(`Cannot transition ${resource} from '${from}' to '${to}'.`);
  }
}

export class UnbalancedJournalError extends AppError {
  readonly code = 'UNBALANCED_JOURNAL';
  readonly httpStatus = 422;
  constructor(debit: number, credit: number) {
    super(`Journal entry is unbalanced: debit ${debit} ≠ credit ${credit}.`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Global error handler plugin
// ─────────────────────────────────────────────────────────────────────────────

export const errorHandlerPlugin = fp(async (app) => {
  app.setErrorHandler((error: FastifyError | AppError | ZodError | Error, req, reply) => {
    const requestId = req.id;

    // Zod validation errors (from schema .parse() in controllers)
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
          requestId,
        },
      });
    }

    // Known application errors
    if (error instanceof AppError) {
      return reply.status(error.httpStatus).send({
        error: {
          code: error.code,
          message: error.message,
          requestId,
        },
      });
    }

    // Fastify built-in errors (e.g. 404 from route not found)
    const fastifyError = error as FastifyError;
    if (fastifyError.statusCode && fastifyError.statusCode < 500) {
      return reply.status(fastifyError.statusCode).send({
        error: {
          code: 'REQUEST_ERROR',
          message: fastifyError.message,
          requestId,
        },
      });
    }

    // Unexpected errors — log internally, never expose details to client
    req.log.error({ err: error, requestId }, 'Unhandled error');
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again or contact support.',
        requestId,
      },
    });
  });

  // 404 handler for unmatched routes
  app.setNotFoundHandler((req, reply) => {
    return reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.url} not found.`,
        requestId: req.id,
      },
    });
  });
});
