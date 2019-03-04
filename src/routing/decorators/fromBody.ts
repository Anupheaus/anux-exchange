import { bodyParamsKey } from '../isFromBody';
import { Router } from '../router';

export function fromBody(target: Router, key: string, parameterIndex: number) {
  const bodyParams = target[bodyParamsKey] = target[bodyParamsKey] || {};
  bodyParams[key] = parameterIndex;
}
