import { Router } from './router';
import { Router as ExpressRouter, Handler, Response, Request } from 'express';
import { IMap, ConstructorOf } from 'anux-common';
import { RouterRegistrationError } from '../errors/routerRegistration';
import { HttpMethods, IRoute } from '../models';

export interface IRegisterRoutesConfig {
  routes: IMap<ConstructorOf<Router>>;
  router: ExpressRouter;
  pathToViews?: string;
  onRequestStarted?(url: string, method: HttpMethods): void;
  onRequestEnded?(url: string, method: HttpMethods, statusCode: number, timeTaken: number): void;
  onAuthenticationRequired?(response: Response, request: Request, route: IRoute): void;
}

export function registerRoutes(config: IRegisterRoutesConfig): Handler {
  Reflect.ownKeys(config.routes)
    .map((key: string) => {
      const routerType = config.routes[key];
      if (typeof (routerType) !== 'function') { return; }
      try {
        const instance = new routerType();
        instance['register'](config);
      } catch (error) {
        throw new RouterRegistrationError(`Unable to register router ${routerType.name}.`, error);
      }
    });
  return config.router;
}
