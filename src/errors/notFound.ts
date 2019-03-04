import { BaseError } from 'anux-common';

export class NotFoundError extends BaseError {
  constructor(message: string);
  constructor(message: string, info: object);
  constructor(message: string, info?: object) {
    super({
      code: 404,
      message,
      info,
    }, NotFoundError);
  }
}
