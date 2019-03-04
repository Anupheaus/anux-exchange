import { routePrefixKey } from '../getRoutePrefixFor';

export function routePrefix(url: string) {
  return <TFunction extends Function>(target: TFunction): TFunction => {
    target.prototype[routePrefixKey] = url;
    return target;
  };
}
