// tslint:disable: max-classes-per-file
import { HttpMethods } from '../../models';
import { getRoutesFor } from '../getRoutesFor';
import { Router } from '../router';
import { route } from './route';

describe('Route Decorator', () => {

  it('can be applied to a method in a class', () => {
    class TestController extends Router {

      @route(HttpMethods.Get, '/test')
      public testRoute() {
        return;
      }
    }
    const testController = new TestController();
    const routes = getRoutesFor(testController);
    expect(routes).to.be.an('array').with.lengthOf(1);
  });

  it('gets the correct parameter names and method name', () => {
    class TestController extends Router {
      @route(HttpMethods.Get, '/test')
      // @ts-ignore
      private testRoute(id: string, body: object, code: number): boolean {
        return true;
      }
    }
    const testController = new TestController();
    const routes = getRoutesFor(testController);
    const routeData = routes[0];
    expect(routeData).to.have.property('method', HttpMethods.Get);
    expect(routeData).to.have.property('url', '/test');
    expect(routeData).to.have.property('parameterNames').to.be.an('array').and.eql(['id', 'body', 'code']);
    expect(routeData).to.have.property('handler').and.be.a('function');
    expect(routeData.handler).to.have.property('name', 'testRoute');
    expect(routeData).to.have.property('options').and.not.be.undefined;
    const options = routeData.options;
    expect(options).to.have.property('isSecure', false);
    expect(options).to.have.property('caching').and.not.be.undefined;
    const caching = options.caching;
    expect(caching).to.have.property('age', 0);
  });

  it('handler executes the correct methods', () => {
    class TestController extends Router {
      @route(HttpMethods.Get, '/test')
      // @ts-ignore
      private testRoute1(arg1: string): string {
        return arg1;
      }

      @route(HttpMethods.Post, '/test')
      // @ts-ignore
      private testRoute2(arg1: string): string {
        return 'other';
      }
    }
    const testController = new TestController();
    const routes = getRoutesFor(testController);
    expect(routes).to.be.an('array').with.lengthOf(2);
    const [route1, route2] = routes;
    expect(route1.handler('hey')).to.eql('hey');
    expect(route2.handler()).to.eql('other');
  });

  it('handler executes overridden methods', () => {
    class TestController extends Router {
      @route(HttpMethods.Get, '/test')
      protected testRoute(arg1: string): string {
        return arg1;
      }
    }
    class TestDerivedController extends TestController {
      protected testRoute(_arg1: string): string {
        return 'overridden';
      }
    }
    const testDerivedController = new TestDerivedController();
    const routes = getRoutesFor(testDerivedController);
    expect(routes).to.be.an('array').with.lengthOf(1);
    const routeData = routes[0];
    expect(routeData.handler('hey')).to.eql('overridden');
  });

});
