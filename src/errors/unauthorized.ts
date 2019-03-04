import { BaseError } from 'anux-common';

export class UnauthorizedError extends BaseError {
  constructor(message?: string) {
    super({
      code: 401,
      message: message || 'You are not authorised to view this resource.',
    }, UnauthorizedError);
  }
}
