import { NotFoundError } from '../errors';
import { Request, NextFunction, Response } from 'express';

export function notFoundHandler() {
  return (error: Error, request: Request, _res: Response, next: NextFunction) => {
    if (error) { next(error); }
    throw new NotFoundError('No valid route was found for this request.', { method: request.method, path: request.path });
  };
}
