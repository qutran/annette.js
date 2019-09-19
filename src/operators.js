export function map(fn) {
  return ({ next, value }) => {
    next(value instanceof Array ? value.map(fn) : fn(value));
  };
}

export function filter(fn) {
  return ({ next, value }) => {
    value instanceof Array ? next(value.filter(fn)) : fn(value) && next(value);
  };
}

export function promise(fn) {
  return ({ next, value, error }) => {
    let isCancelled = false;
    const cancelable = callback => payload => !isCancelled && callback(payload);
    fn(value)
      .then(cancelable(next))
      .catch(cancelable(error));

    return () => (isCancelled = true);
  };
}

export function effect(fn) {
  return ({ next, value }) => {
    next(value);
    return fn(value, next);
  };
}

export function stream(fn) {
  return ({ next, value }) => fn(value).subscribe(next);
}

export function timeout(ms, onTick = _ => _) {
  return ({ next, value }) => {
    const _timeout = setTimeout(() => next(onTick(value)), ms);
    return () => clearTimeout(_timeout);
  };
}

export function interval(ms, onTick = _ => _) {
  return ({ next, value }) => {
    let _value = value;
    const _interval = setInterval(() => next((_value = onTick(_value))), ms);
    return () => clearInterval(_interval);
  };
}
