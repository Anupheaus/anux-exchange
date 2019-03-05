import { NotFoundError } from '../errors';
import { Request } from 'express';

export function notFoundHandler() {
  return (req: Request) => {
    throw new NotFoundError('No valid route was found for this request.', { method: req.method, path: req.path });
  };
}
