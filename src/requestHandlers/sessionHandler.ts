import * as session from 'express-session';

interface IConfig {
  secretKey: string;
}

export function sessionHandler({ secretKey }: IConfig) {
  if (typeof (secretKey) !== 'string' || secretKey.length === 0) { throw new Error('The session secret key was not set correctly in the configuration for the session handler.'); }
  return session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: true,
    },
  });
}
