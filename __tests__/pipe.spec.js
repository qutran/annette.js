import { pipe } from '../src';
import { createStore } from './store';

describe('pipe', () => {
  it('pipe: sholud create pipe', () => {
    const unsubSpy = jest.fn();
    const store = createStore(10);

    const unsubscribe = pipe(
      store,
      ({ next, value }) => next(value + 1),
      ({ next, value }) => {
        next(value ** 2);
        return unsubSpy;
      },
    ).subscribe(value => {
      expect(value).toEqual(121);
    });

    unsubscribe();

    expect(unsubSpy).toBeCalled();
  });

  it('pipe: should catch the error', () => {
    const store = createStore(10);
    const errorFn = jest.fn();

    const unsub = pipe(
      store,
      ({ error }) => {
        error('error text');
        return () => {};
      },
      ({ next }) => next(20),
    )
      .catch(errorFn)
      .subscribe();

    store.set(1);
    unsub();
    expect(errorFn).toBeCalledWith('error text');
  });

  it('pipe: should subscribe on the new data', () => {
    const store = createStore(10);
    const spyFn = jest.fn();

    pipe(
      store,
      ({ next, value }) => next(value * 2),
    ).subscribe(value => {
      spyFn();
      expect(value).toEqual(20);
    });

    store.set(10);
    expect(spyFn.mock.calls.length).toEqual(2);
  });

  it('pipe: should correct unsubscribe without exception', () => {
    const store = createStore(10);
    const subject = pipe(
      store,
      () => {},
    );

    const unsubFirst = subject.subscribe(() => {});
    const unsubSecond = subject.subscribe(() => {});
    unsubFirst();
    unsubSecond();
  });

  it('pipe: should return source on empty operations', () => {
    const store = createStore(10);
    const piped = pipe(store);
    expect(store).toEqual(piped);
  });

  it('pipe: should throw an error on empty source', () => {
    expect(pipe).toThrow();
  });
});
