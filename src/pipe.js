function throwIfNotExists() {
  throw new Error('Source should be defined');
}

export function pipe(source = throwIfNotExists(), ...operations) {
  if (!operations.length) return source;
  const { subscribe: selfSubscribe, catch: selfCatch, ...selfMethods } = source;

  const list = operations.reduceRight(createNode, null);
  const UNSET_VALUE = {};
  let listeners = [];
  let errorListeners = [];
  let unsubscribeSource = null;
  let currentValue = UNSET_VALUE;

  function createNode(next, op) {
    return { next, op: wrapOperation(next, op) };
  }

  function wrapOperation(nextNode, rawOp) {
    const next = nextNode ? nextNode.op.execute : dispatch;
    const op = value => rawOp({ next, error: dispatchError, value });
    let unsubscribe = null;

    return {
      execute: value => {
        if (unsubscribe) unsubscribe();
        try {
          unsubscribe = op(value);
        } catch (ex) {
          dispatchError(ex);
        }
      },
      unsubscribe() {
        if (unsubscribe) unsubscribe();
      },
    };
  }

  function dispatch(value) {
    currentValue = value;
    for (let i = 0; i < listeners.length; i++) {
      listeners[i](currentValue);
    }
  }

  function dispatchError(error) {
    currentValue = UNSET_VALUE;
    for (let i = 0; i < errorListeners.length; i++) {
      errorListeners[i](error);
    }
  }

  function unsubscribeAll() {
    unsubscribeSource();
    let currentNode = list;
    do currentNode.op.unsubscribe();
    while ((currentNode = currentNode.next));
  }

  function subscribe(fn) {
    if (!listeners.length) {
      unsubscribeSource = selfSubscribe(list.op.execute);
    }

    listeners.push(fn);
    if (currentValue !== UNSET_VALUE) {
      fn(currentValue);
    }

    return function unsubscribe() {
      const index = listeners.indexOf(fn);
      listeners.splice(index, 1);
      if (!listeners.length) unsubscribeAll();
    };
  }

  function onCatch(errorFn) {
    return {
      subscribe(fn) {
        errorListeners.push(errorFn);
        const unsubscribe = subscribe(fn);
        return () => {
          const index = errorListeners.indexOf(errorFn);
          errorListeners.splice(index, 1);
          unsubscribe();
        };
      },
      ...selfMethods,
    };
  }

  return { subscribe, catch: onCatch, ...selfMethods };
}
