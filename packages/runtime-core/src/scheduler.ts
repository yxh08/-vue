export function createSchedulerFn(instance, fn) {
  return () => fn(instance)
}

export function nextTick(fn) {
  return Promise.resolve().then(fn)
}
