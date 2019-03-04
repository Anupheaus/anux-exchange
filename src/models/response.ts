export interface IResponse<T= any> {
  code: number;
  body: T;
  contentType: string;
  contentDisposition?: string;
}

export interface IListResponse<T = any> {
  total?: number;
  data: T[];
}
