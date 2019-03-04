export interface IRouteOptions {
  caching?: {
    /**
     * Number of minutes to cache the response of this route for.
     */
    age: number;
  };
  /**
   * Should this route be secured?
   */
  isSecure?: boolean;
}
