import { NextFunction, Response, Request } from 'express';
import { IMap, is } from 'anux-common';
import * as jwt from 'jsonwebtoken';

interface IConfig<TUser extends IMap> {
  secret: ((request: Request) => string) | string;
  applicationName: string;
  timeToLive?: number;
  emptyUser(): TUser;
  validate?(user: TUser): TUser;
  onError?(error: Error): void;
}

const jwtSubject = 'Authorization';
const twoHours = 2 * 60 * 60 * 1000;

export function jwtAuthenticationHandler<TUser extends IMap>({ secret, applicationName, emptyUser, validate, timeToLive = twoHours, onError }: IConfig<TUser>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const secretAsString = is.function(secret) ? secret(req) : secret;
    let authorizationToken = req.header('Authorization');
    let user: TUser;

    if (authorizationToken) {
      try {
        authorizationToken = authorizationToken.substr(7); // remove 'Bearer'
        const data = jwt.verify(authorizationToken, secretAsString, { issuer: applicationName, subject: jwtSubject }) as IMap;
        if (data && data.user) {
          user = data.user;
          if (validate) { user = validate(user); }
        }
      } catch (error) { /* do nothing */ }
    }
    let userIsValid = !!user;
    user = user || emptyUser();

    const setUserOnResponse = (newUser: TUser) => {
      try {
        if (res.headersSent) { throw new Error('Cannot set the user here, the headers for this request have already been sent.'); }
        user = newUser;
        if (userIsValid) {
          authorizationToken = jwt.sign({ user }, secretAsString, { issuer: applicationName, subject: jwtSubject, expiresIn: timeToLive });
          res.set('authorization', `Bearer ${authorizationToken}`);
        } else {
          res.removeHeader('authorization');
        }
      } catch (error) {
        if (onError) { onError(error); } else { throw error; }
      }
    };

    if (userIsValid) { setUserOnResponse(user); } // if the user is already valid, set the user on the response

    Object.defineProperty(req, 'user', {
      get: () => user,
      enumerable: true,
      configurable: true,
    });

    req.setUser = (newUser: TUser) => { userIsValid = !!newUser; setUserOnResponse(newUser); };
    req.clearUser = () => { userIsValid = false; setUserOnResponse(user = emptyUser()); };

    next();

  };
}
