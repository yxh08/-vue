import { goCollect, goTrigger } from './dep'
import { isRef } from './ref'
import { hasChanged, isObject } from '@vue/shared/src/utils'
import { reactive } from './reactive'

export const mutableHandlers = {
  get(target, key, receiver) {
    goCollect(target, key)
    const res = Reflect.get(target, key, receiver) //receiver === proxy

    if (isRef(res)) {
      return res.value
    }

    if (isObject(res)) {
      return reactive(res)
    }

    return res
  },
  set(target, key, newValue, receiver) {
    const oldValue = target[key]
    const res = Reflect.set(target, key, newValue, receiver)

    if (hasChanged(oldValue, newValue)) {
      if (isRef(oldValue) && !isRef(newValue)) {
        oldValue.value = newValue // 会触发ref的set 从而触发set中的trigger
        return res
      }
      goTrigger(target, key)
    }
    return res
  },
}
