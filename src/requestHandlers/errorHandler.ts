import { BaseError } from 'anux-common';
import { Request, Response, NextFunction } from 'express';

interface IConfig {
  outputStackTrace?: boolean;
  title: string;
  errorViewName?: string;
}

function formatStackFrames(stackTrace: string): string[] {
  const frames = stackTrace.replace(/\\/g, '\\\\').split(/\n/);
  if (frames.length > 1) { frames.shift(); }
  return frames;
}

export function errorHandler(config: IConfig) {
  config = {
    outputStackTrace: false,
    ...config,
  };
  return (error: Error, _req: Request, res: Response, _next: NextFunction) => {
    const stackTraceFrames = config.outputStackTrace ? formatStackFrames(error.stack) : undefined;
    const name = error.constructor.name;
    const stackTrace = stackTraceFrames == null || stackTraceFrames.length === 0 ? undefined : `${stackTraceFrames.join('<br />').replace(/\s{2,}/g, '')}`;
    const message = error.message;
    const { type = null, title: _2 = null, message: _3 = null, stackTrace: _4 = null, ...infoData } = error['toJSON']();
    const info = JSON.stringify(infoData);
    const code = error instanceof BaseError ? error.code : 500;

    res.locals = {
      title: config.title,
      error: {
        name,
        message,
        stackTrace,
        info,
      },
    };

    // set the status code
    res.status(code);

    // check to see if we are to render an error page or not
    if (config.errorViewName) {
      // render the error page
      res.render(config.errorViewName);
    } else {
      // send a json response
      res.send({ name, message, stackTrace, info });
    }
  };
}
