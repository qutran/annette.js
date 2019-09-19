import {
  map,
  filter,
  promise,
  effect,
  stream,
  timeout,
  interval,
} from '../src';

function tick() {
  return new Promise(requestAnimationFrame);
}

describe('operators', () => {
  it('should correctly map', () => {
    const next = jest.fn();
    const sourceSingle = 10;
    const sourceArray = [1, 2, 3];
    const fn = item => item * 2;
    const myMap = map(fn);
    myMap({ next, value: sourceSingle });
    myMap({ next, value: sourceArray });
    expect(next.mock.calls[0][0]).toEqual(20);
    expect(next.mock.calls[1][0]).toEqual([2, 4, 6]);
  });

  it('should correctly filter', () => {
    const next = jest.fn();
    const sourceSingleStop = 10;
    const sourceSingleNext = 11;
    const sourceArray = [1, 2, 3, 4, 5, 6, 7, 8];
    const fn = item => item % 2;
    const myFilter = filter(fn);
    myFilter({ next, value: sourceSingleStop });
    expect(next.mock.calls.length).toEqual(0);
    myFilter({ next, value: sourceSingleNext });
    expect(next.mock.calls[0][0]).toEqual(11);
    myFilter({ next, value: sourceArray });
    expect(next.mock.calls[1][0]).toEqual([1, 3, 5, 7]);
  });

  it('should correctly to proceed resolved promise', async () => {
    const next = jest.fn();
    const myPromise = promise(
      value => new Promise(resolve => resolve(value * 2)),
    );

    myPromise({ value: 10, next });
    await tick();
    expect(next).toBeCalledWith(20);
  });

  it('should correctly to proceed rejected promise', async () => {
    const error = jest.fn();
    const myPromise = promise(
      value => new Promise((resolve, reject) => reject('error message')),
    );

    myPromise({ value: 10, error });
    await tick();
    expect(error).toBeCalledWith('error message');
  });

  it('should correctly cancel the promise', async () => {
    const next = jest.fn();
    const myPromise = promise(
      value => new Promise(resolve => resolve(value * 2)),
    );

    myPromise({ value: 10, next })(); // revoke immediately
    myPromise({ value: 20, next });
    await tick();
    expect(next.mock.calls.length).toEqual(1);
  });

  it('should correctly proceed effect', () => {
    const next = jest.fn();
    const myEffect = effect((value, next) => next(value + 1));
    myEffect({ next, value: 0 });
    expect(next.mock.calls[0][0]).toEqual(0);
    expect(next.mock.calls[1][0]).toEqual(1);
  });

  it('should correctly proceed stream', () => {
    const next = jest.fn();
    const mockedStream = { subscribe: jest.fn() };
    const myStream = stream(() => mockedStream);
    myStream({ value: 10, next });
    expect(mockedStream.subscribe).toBeCalledWith(next);
  });

  it('should correctly proceed timeout', done => {
    const next = jest.fn();
    timeout(100, value => value + 1)({ next, value: 10 });
    setTimeout(() => {
      expect(next).not.toBeCalled();
    }, 50);
    setTimeout(() => {
      expect(next).toBeCalledWith(11);
      done();
    }, 101);
  });

  it('should correctly proceed timeout with default onTick callback', done => {
    const next = jest.fn();
    timeout(100)({ next, value: 10 });
    setTimeout(() => {
      expect(next).toBeCalledWith(10);
      done();
    }, 101);
  });

  it('should correctly proceed revoke timeout', done => {
    const next = jest.fn();
    timeout(100)({ next, value: 10 })(); // revoke immediately
    setTimeout(() => {
      expect(next).not.toBeCalled();
      done();
    }, 101);
  });

  it('should correctly proceed interval', done => {
    const next = jest.fn();
    const unsub = interval(40, value => value + 1)({ next, value: 10 });
    setTimeout(() => {
      expect(next.mock.calls[0][0]).toEqual(11);
    }, 50);
    setTimeout(() => {
      expect(next.mock.calls[1][0]).toEqual(12);
      unsub();
    }, 101);
    setTimeout(() => {
      expect(next.mock.calls.length).toEqual(2);
      done();
    }, 130);
  });

  it('should correctly proceed interval with default onTick callback', done => {
    const next = jest.fn();
    const unsub = interval(40)({ next, value: 10 });
    setTimeout(() => {
      expect(next).toBeCalledWith(10);
      unsub();
      done();
    }, 81);
  });
});
