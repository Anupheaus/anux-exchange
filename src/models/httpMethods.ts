export enum HttpMethods {
  Any,
  Get,
  Post,
  Put,
  Patch,
  Delete,
}

export namespace HttpMethods {

  export function identifyFrom(method: string): HttpMethods {
    switch (method.toLowerCase()) {
      case 'get': return HttpMethods.Get;
      case 'post': return HttpMethods.Post;
      case 'put': return HttpMethods.Put;
      case 'patch': return HttpMethods.Patch;
      case 'delete': return HttpMethods.Delete;
      default: return HttpMethods.Any;
    }
  }

  export function toString(method: HttpMethods): string {
    return HttpMethods[method].toLowerCase();
  }

}
