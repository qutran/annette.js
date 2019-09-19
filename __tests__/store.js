export function createStore(initialValue) {
  let subs = [];
  let _value = initialValue;

  function set(value) {
    _value = value;
    for (const sub of subs) {
      sub(value);
    }
  }

  function subscribe(fn) {
    subs.push(fn);
    fn(_value);
    return () => {
      const index = subs.indexOf(fn);
      subs.splice(index, 1);
    };
  }

  return { subscribe, set };
}
