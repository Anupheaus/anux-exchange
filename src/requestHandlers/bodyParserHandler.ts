import * as bodyParser from 'body-parser';
import { NextFunction, Request, Response } from 'express';

/**
 * Enables the parsing of JSON request bodies.
 */
export function bodyParserHandler() {
  return async (req: Request, res: Response, next: NextFunction) => {
    bodyParser.json({})(req, res, () => {
      bodyParser.urlencoded({ extended: false })(req, res, next);
    });
  };
}
