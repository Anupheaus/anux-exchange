import { Router } from './router';

export const bodyParamsKey = Symbol('bodyParams');

export function isFromBody(target: Router, key: string, parameterIndex: number): boolean {
  const prototype = Reflect.getPrototypeOf(target);
  const bodyParams = prototype[bodyParamsKey] = prototype[bodyParamsKey] || {};
  return bodyParams[key] === parameterIndex;
}
