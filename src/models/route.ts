import { is } from 'anux-common';
import { HttpMethods } from './httpMethods';
import { IRouteOptions } from './routeOptions';

export interface IRoute {
  method: HttpMethods;
  url: string;
  parameterNames: string[];
  handler: Function;
  options: IRouteOptions;
  isBound: boolean;
}

export namespace IRoute {

  export function normalize(...urls: string[]): string {
    const fullUrl = urls
      .map(url => {
        if (is.empty(url)) { return null; }
        if (url.startsWith('/') || url.startsWith('\\')) { url = url.substr(1); }
        if (url.endsWith('/') || url.endsWith('\\')) { url = url.substr(0, url.length - 1); }
        return url;
      })
      .removeByFilter(is.empty)
      .join('/');
    return `/${fullUrl}`;
  }

}
