import { BadRequestError } from '../errors';
import { Request } from 'express';

export function notFoundHandler() {
  return (req: Request) => {
    const error = new BadRequestError('No valid route was found for this request.', { method: req.method, path: req.path });
    throw error;
  };
}
