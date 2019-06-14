import { InternalError, is, PromiseMaybe } from 'anux-common';
import * as path from 'path';
import { IResponse, IRoute, IListResponse, HttpMethods, IFileUpload } from '../models';
import { getRoutePrefixFor } from './getRoutePrefixFor';
import { getRoutesFor } from './getRoutesFor';
import { isFromBody } from './isFromBody';
import * as pug from 'pug';
import { Request, Response } from 'express';
import { IRegisterRoutesConfig } from './registerRoutes';

interface IRawOptions {
  filename?: string;
}

export abstract class Router {

  //#region Variables

  private _config: IRegisterRoutesConfig;

  //#endregion

  //#region Methods

  protected json<T>(value: T, statusCode?: number): IResponse<T>;
  protected json<T>(value: Promise<T>, statusCode?: number): Promise<IResponse<T>>;
  protected json<T>(value: PromiseMaybe<T>, statusCode: number = 200): PromiseMaybe<IResponse<T>> {
    return this.resolve(value, body => ({
      code: statusCode,
      body,
      contentType: 'application/json;charset=utf-8',
    }));
  }

  protected list<T>(array: T[]): IResponse<IResponse<T>>;
  protected list<T>(array: PromiseMaybe<T[]>): PromiseMaybe<IResponse<IListResponse<T>>>;
  protected list<T>(array: T[] | Promise<T[]>): any {
    return this.resolve(array, data => this.json<IListResponse<T>>({
      data,
      total: data.length,
    }));
  }

  protected ok(): IResponse<void> {
    return {
      code: 200,
      body: null,
      contentType: null,
    };
  }

  protected download(buffer: Buffer, filename: string): IResponse<Buffer>;
  protected download(buffer: Buffer, filename: string, contentType: string): IResponse<Buffer>;
  protected download(buffer: Buffer, filename: string, contentType: string = 'application/octet-stream'): IResponse<Buffer> {
    return {
      code: 200,
      body: buffer,
      contentType,
      contentDisposition: `attachment; filename="${filename}"`,
    };
  }

  protected async view(name: string, locals: object = {}): Promise<IResponse<string>> {
    const pathToViews = this._config ? this._config.pathToViews : undefined;
    if (is.empty(pathToViews)) { throw new InternalError('A view was requested but the views location has not been set for this router.', { router: this.constructor.name }); }
    const fileName = path.resolve(pathToViews, `${name}.pug`);
    const compiledView = pug.compileFile(fileName);
    if (!is.function(compiledView)) { throw new InternalError('Unable to find the view requested.', { router: this.constructor.name, view: name }); }
    const body = compiledView(locals);
    return {
      code: 200,
      body,
      contentType: 'text/html',
    };
  }

  protected raw<T>(value: T): IResponse<T>;
  protected raw<T>(value: T, statusCode: number): IResponse<T>;
  protected raw<T>(value: T, statusCode: number, contentType: string): IResponse<T>;
  protected raw<T>(value: T, statusCode: number, contentType: string, options: IRawOptions): IResponse<T>;
  protected raw<T>(value: T, statusCode: number = 200, contentType: string = 'text/html', options: IRawOptions = null): IResponse<T> {
    options = {
      filename: undefined,
      ...options,
    };
    return {
      code: statusCode,
      body: value,
      contentType,
      contentDisposition: options.filename ? `attachment; filename=${options.filename}` : undefined,
    };
  }

  protected redirect(url: string): IResponse<string> {
    return {
      code: 302,
      body: url,
      contentType: 'text/html',
    };
  }

  protected register(config: IRegisterRoutesConfig) {
    const routes: IRoute[] = getRoutesFor(this);
    const routePrefix = getRoutePrefixFor(this);

    this._config = config;
    routes.forEach(route => {
      let method = HttpMethods[route.method].toLowerCase();
      if (route.method === HttpMethods.Any) { method = 'all'; }
      const parameterNames = route.parameterNames;
      const url = IRoute.normalize(routePrefix, route.url);
      config.router[method](url, (req: Request, res: Response) => {
        const startTime = new Date();
        const httpMethod = HttpMethods.identifyFrom(req.method);
        if (config.onRequestStarted) { config.onRequestStarted(url, httpMethod); }
        if (!this.authenticate(route, req, res)) { return; }
        const args = this.createArgs(req, res, route.handler.name, parameterNames);
        this.getResponse(route, args, response => {
          this.sendResponse(route, response, res);
          if (config.onRequestEnded) { config.onRequestEnded(url, httpMethod, response.code, startTime.getElapsed(new Date())); }
        });
      });
    });
  }

  protected createArgs(req: Request, res: Response, methodName: string, parameterNames: string[]): any[] {
    return parameterNames.map((name, index) => {
      if (isFromBody(this, methodName, index)) { name = 'body'; }
      switch (name.toLowerCase()) {
        case 'body':
          return req.body;
        case 'req':
        case 'request':
          return req;
        case 'res':
        case 'response':
          return res;
        case 'path':
          return req.path;
        case 'method':
          return req.method;
        case 'user':
          return req['user'];
        case 'files':
          return this.formatFiles(req['files']);
        default:
          return this.retrieveParameter(req, name);
      }
    });
  }

  protected createEmptyResponse(): IResponse {
    return {
      code: 200,
      body: null,
      contentType: 'text/html',
    };
  }

  protected validateResponse(route: IRoute, response: IResponse): void {
    const isResponseValid = typeof (response.code) === 'number';
    if (!isResponseValid) { throw new InternalError('The response provided by this controller action was invalid.', { route, response }); }
  }

  protected sendResponse(route: IRoute, response: IResponse, res: Response): void {
    if (response.code === 302) { this.performRedirect(response, res); return; }
    res.status(response.code);
    if (!res.headersSent) {
      if (route.options.caching.age > 0) { res.header('cache-control', (route.options.caching.age * 60).toString()); }
      if (is.stringAndNotEmpty(response.contentType)) { res.setHeader('content-type', response.contentType); }
      if (is.stringAndNotEmpty(response.contentDisposition)) { res.setHeader('content-disposition', response.contentDisposition); }
    }
    if (response.body) {
      if (is.stringAndNotEmpty(response.contentType) && response.contentType.indexOf('application/json') >= 0 && typeof (response.body) !== 'string') {
        res.send(JSON.stringify(response.body));
      } else {
        res.send(response.body);
      }
    } else if (is.function(res.end)) {
      res.end();
    }
  }

  private performRedirect(response: IResponse, res: Response): void {
    res.redirect(response.code, response.body);
  }

  private resolve<T, R>(value: PromiseMaybe<T>, constructResponse: (value: T) => R): PromiseMaybe<R> {
    if (is.promise(value)) { return Promise.resolve(value).then(constructResponse); }
    return constructResponse(value);
  }

  private getResponse(route: IRoute, args: any[], callback: (response: IResponse) => void) {
    const response: PromiseMaybe<IResponse> = route.handler(...args);
    if (response == null) { return this.createEmptyResponse(); }
    const handleResponse = (innerResponse: IResponse) => {
      try {
        this.validateResponse(route, innerResponse);
        callback(innerResponse);
      } catch (error) {
        throw new InternalError('An unexpected error has occurred.', { route }, error);
      }
    };
    return is.promise(response) ? response.then(handleResponse).catch(handleResponse) : handleResponse(response);
  }

  private retrieveParameter(req: any, name: string): string {
    return [req.params, req.pathParams, req.query, req.queryParams]
      .filter(store => !!store)
      .filter(store => store[name] !== undefined)
      .map(store => store[name])
      .firstOrDefault();
  }

  private formatFiles(files: object): IFileUpload[] {
    if (!files) { return []; }
    return Object
      .keys(files)
      .map<IFileUpload>(key => {
        const file = files[key];
        return {
          ...IFileUpload.splitName(file.name),
          data: file.data,
          encoding: file.encoding,
          mimetype: file.mimetype,
        };
      });
  }

  private authenticate(route: IRoute, req: Request, res: Response): boolean {
    if (!route.options.isSecure) { return true; }
    if (!req.user) {
      if (this._config.onAuthenticationRequired) {
        this._config.onAuthenticationRequired(res, req, route);
        return false;
      }
      return true;
    }
  }

  //#endregion

}
