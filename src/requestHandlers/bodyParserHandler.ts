import * as bodyParser from 'body-parser';
import { IncomingMessage, ServerResponse } from 'http';
import { NextFunction } from 'express';

/**
 * Enables the parsing of JSON request bodies.
 */
export function bodyParserHandler() {
  return async (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
    bodyParser.json({})(req, res, () => {
      bodyParser.urlencoded({ extended: false })(req, res, next);
    });
  };
}
