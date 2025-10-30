import { getCurrentInstance } from './component'

export function provide(key, value) {
  const vm = getCurrentInstance()
  vm.provides[key] = value
}

export function inject(key, defaultValue) {
  const vm = getCurrentInstance()
  const parentProvide = vm.parent.provides
  if (parentProvide[key]) {
    return parentProvide[key]
  } else {
    return defaultValue
  }
}
