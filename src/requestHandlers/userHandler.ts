import { Request, Response, NextFunction } from 'express';
import { PromiseMaybe } from 'anux-common';

export function userHandler<T extends {}>(getUser: (req: Request) => PromiseMaybe<T>) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const user = await getUser(req);
    if (!user) { next(); }
    req['user'] = user;
    next();
  };
}
