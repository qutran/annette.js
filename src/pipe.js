function throwIfNotExists() {
  throw new Error('Source should be defined');
}

export function pipe(source = throwIfNotExists(), ...operations) {
  if (!operations.length) return source;

  const list = operations.reduceRight(createNode, null);
  const UNSET_VALUE = {};
  let listeners = [];
  let errorListeners = [];
  let unsubscribeSource = null;
  let currentValue = UNSET_VALUE;

  function createNode(next, op) {
    return { next, op: wrapOperation(next, op) };
  }

  function wrapOperation(next, rawOp) {
    const nextNode = next ? next.op.execute : dispatch;
    const op = value => rawOp({ next: nextNode, error: dispatchError, value });
    let unsubscribe = null;

    return {
      execute: value => {
        if (unsubscribe) unsubscribe();
        unsubscribe = op(value);
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
      unsubscribeSource = source.subscribe(list.op.execute);
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
        const unsubscribe = subscribe(fn);
        errorListeners.push(errorFn);
        return () => {
          const index = errorListeners.indexOf(errorFn);
          errorListeners.splice(index, 1);
          unsubscribe();
        };
      },
    };
  }

  return { subscribe, catch: onCatch };
}