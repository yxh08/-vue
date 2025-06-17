export function isObject(value) {
  return typeof value === 'object' && value !== null
}

export function hasChanged(newValue: any, oldValue) {
  return !Object.is(newValue, oldValue)
}

export function isFunction(value) {
  return typeof value === 'function'
}
