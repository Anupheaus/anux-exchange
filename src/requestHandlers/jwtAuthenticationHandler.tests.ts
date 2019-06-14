import chaiHttp from 'chai-http';
import express from 'express';
import * as jwt from 'jsonwebtoken';
import '../models';
import { jwtAuthenticationHandler } from './jwtAuthenticationHandler';

chai.use(chaiHttp);

type jwtConfig = Parameters<typeof jwtAuthenticationHandler>[0];
const applicationName = 'anux-exchange-test-server';
const jwtSubject = 'Authorization';

describe('requestHandlers - jwtAuthenticationHandler', () => {

  function applyDefaultsToConfig(config: Partial<jwtConfig>): jwtConfig {
    return {
      applicationName,
      secret: Math.uniqueId(),
      timeToLive: 2 * 60 * 60 * 1000, // 2 hours
      emptyUser() { return {}; },
      validate: user => user,
      onError: () => void 0,
      ...config,
    };
  }

  function createMockServer(config?: Partial<jwtConfig>) {
    const app = express();
    const fullConfig = applyDefaultsToConfig(config);
    app.use(jwtAuthenticationHandler(fullConfig));
    app.get('/api/test', (_req, res) => {
      res.sendStatus(200);
      res.send();
    });
    app.get('/api/authorize', async (req, res) => {
      await Promise.delay(1);
      req.setUser({ id: Math.uniqueId() });
      res.sendStatus(200);
      res.send();
    });
    app.get('/api/tooLate', (req, res) => {
      res.sendStatus(200);
      res.send();
      res.end();
      req.setUser({ id: Math.uniqueId() });
    });
    app.get('/api/clearUser', (req, res) => {
      req.clearUser();
      res.sendStatus(200);
      res.send();
    });
    app.get('/api/getUser', (req, res) => {
      res.contentType('application/json');
      res.send(JSON.stringify(req.user));
      res.sendStatus(200);
    });
    return app;
  }

  function createMockToken(config: Partial<jwtConfig>) {
    const fullConfig = applyDefaultsToConfig(config);
    return jwt.sign({ user: { id: Math.uniqueId() } }, fullConfig.secret as string, {
      issuer: config.applicationName,
      subject: jwtSubject,
      expiresIn: fullConfig.timeToLive,
    });
  }

  it('can make a request with a token and it be in the response automatically', async () => {
    const config: Partial<jwtConfig> = {
      secret: Math.uniqueId(),
      applicationName,
    };
    const app = createMockServer(config);
    const token = createMockToken(config);
    const response = await chai.request(app)
      .get('/api/test')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).to.eq(200);
    expect(response.header.authorization).to.match(/^Bearer\W\S{260,}$/);
  });

  it('can make a request with an expired token and it not be in the response', async () => {
    const config: Partial<jwtConfig> = {
      secret: Math.uniqueId(),
      applicationName,
      timeToLive: 0,
    };
    const app = createMockServer(config);
    const token = createMockToken(config);
    await Promise.delay(1); // delay to allow token to expire
    const response = await chai.request(app)
      .get('/api/test')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).to.eq(200);
    expect(response.header.authorization).to.be.undefined;
  });

  it('can make a request without a token and have one after', async () => {
    const config: Partial<jwtConfig> = {
      secret: Math.uniqueId(),
      applicationName,
    };
    const app = createMockServer(config);
    const response = await chai.request(app)
      .get('/api/authorize');
    expect(response.status).to.eq(200);
    expect(response.header.authorization).to.match(/^Bearer\W\S{260,}$/);
  });

  it('errors if you try to set the user after the headers have been sent', async () => {
    let error: Error;
    const config: Partial<jwtConfig> = {
      secret: Math.uniqueId(),
      applicationName,
      onError: incomingError => {
        error = incomingError;
      },
    };
    const app = createMockServer(config);
    const response = await chai.request(app)
      .get('/api/tooLate');
    expect(error.message).to.eq('Cannot set the user here, the headers for this request have already been sent.');
    expect(response.status).to.eq(200);
    expect(response.header.authorization).to.be.undefined;
  });

  it('clears the current user', async () => {
    const config: Partial<jwtConfig> = {
      secret: Math.uniqueId(),
      applicationName,
    };
    const app = createMockServer(config);
    const token = createMockToken(config);
    const response = await chai.request(app)
      .get('/api/clearUser')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).to.eq(200);
    expect(response.header.authorization).to.be.undefined;
  });

  it('can get the current user', async () => {
    const config: Partial<jwtConfig> = {
      secret: Math.uniqueId(),
      applicationName,
    };
    const app = createMockServer(config);
    const token = createMockToken(config);
    const response = await chai.request(app)
      .get('/api/getUser')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('id').with.lengthOf(36);
  });

});
