import { Router } from './router';

export const routePrefixKey = Symbol('routePrefix');

export function getRoutePrefixFor(router: Router): string {
  const routerPrototype = Reflect.getPrototypeOf(router) as typeof Router;
  return routerPrototype[routePrefixKey] || '';
}
