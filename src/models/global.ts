import { IMap } from 'anux-common';

declare global {
  namespace Express {
    // tslint:disable-next-line:interface-name
    export interface Request {
      readonly user: IMap;
      setUser(user: IMap): void;
      clearUser(): void;
      getAuthenticationToken(): string;
    }
  }
}
