export function isObject(value) {
  return typeof value === 'object' && value !== null
}

export function hasChanged(newValue: any, oldValue) {
  return !Object.is(newValue, oldValue)
}

export function isFunction(value) {
  return typeof value === 'function'
}

export function isEvent(propName: string) {
  return /^on[A-Z]/.test(propName)
}

export function isVNode(value) {
  return value?.__v_isVNode
}

export function isArray(value) {
  return Array.isArray(value)
}

export function isString(value) {
  return typeof value === 'string'
}

export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}
