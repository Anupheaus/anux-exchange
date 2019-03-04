import { IRoute } from '../models';
import { Router } from './router';

const routingData = Symbol('routes');

function bindHandler(route: IRoute, router: Router): void {
  const handler: Function = route.handler.bind(router);
  handler.setName(route.handler.name);
  route.handler = handler;
  route.isBound = true;
}

export function getRoutesFor(router: typeof Router | Router): IRoute[] {
  const routerInfo = Reflect.typeOf(router);
  const routerPrototype = (routerInfo.isInstance ? Reflect.getPrototypeOf(router) : router) as typeof Router;
  const routes: IRoute[] = routerPrototype[routingData] = routerPrototype[routingData] || [];
  if (routerInfo.isInstance) {
    routes
      .filter(route => !route.isBound)
      .forEach(route => bindHandler(route, router as Router));
  }
  return routes;
}
