import { ReactivityEffect } from './effect'
import { isRef } from './ref'
import { isFunction, isObject } from '@vue/shared'
import { isReactive } from './reactive'
export function watch(source, cb, options = { deep: false }) {
  let { deep } = options

  let getter

  if (isRef(source)) {
    getter = () => source.value
  } else if (isReactive(source)) {
    if (deep) {
      deep = deep === true ? Infinity : deep
    } else {
      deep = true
    }
    getter = () => source
  } else if (isFunction(source)) {
    getter = source
  }

  // 设置deep 深度监听
  if (deep) {
    let dept = deep === true ? Infinity : deep
    const baseGetter = getter
    getter = function () {
      const value = baseGetter()
      deepGet(value, dept)
      return value
    }
  }

  let oldValue

  const effect = new ReactivityEffect(getter)

  //收集依赖 并将返回值作为第一次的oldValue
  oldValue = effect.run()

  // 设置调度器
  effect.scheduler = job
  function job() {
    const newValue = getter()
    cb(newValue, oldValue)
    //将这次的 newValue 作为下一次的 oldValue
    oldValue = newValue
  }
}

function deepGet(value, dept, seen = new Set()) {
  if (!isObject(value) || dept <= 0) {
    return
  }
  if (seen.has(value)) {
    return
  } else {
    seen.add(value)
    for (const key in value) {
      dept--
      deepGet(value[key], dept, seen)
    }
  }
}
