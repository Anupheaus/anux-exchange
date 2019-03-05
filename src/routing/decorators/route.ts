import { HttpMethods, IRouteOptions } from '../../models';
import { getRoutesFor } from '../getRoutesFor';
import { Router } from '../router';

export function route(httpMethod: HttpMethods, url: string, options?: IRouteOptions): MethodDecorator {
  return (target: typeof Router, propertyKey: PropertyKey) => {
    const routes = getRoutesFor(target);
    const handler = function routeHandler(...args: any[]) {
      return this[propertyKey].apply(this, args);
    };
    handler.setName(propertyKey.toString());
    options = options || {};
    routes.push({
      method: httpMethod,
      url,
      parameterNames: Reflect.parameterNames(target[propertyKey]),
      options: {
        isSecure: false,
        ...options,
        caching: {
          age: 0,
          ...options.caching,
        },
      },
      handler,
      isBound: false,
    });
  };
}
