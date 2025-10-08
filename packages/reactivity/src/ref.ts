import { activeSub } from './effect'
import { collect, Link, trigger } from './system'
import { ReactiveFlags } from './constance'
import { reactive } from './reactive'
import { hasChanged, isObject } from '@vue/shared/src/utils'

export const ref = (value: any) => {
  return new RefImpl(value)
}
export class RefImpl {
  subs: Link | undefined
  subsTail: Link | undefined;
  [ReactiveFlags.IS_REF] = true
  _value
  constructor(value: any) {
    //ref 如果接收的是对象(之前默认为基础类型) , 那么将他包装成reactive
    this._value = isObject(value) ? reactive(value) : value
    // this._value = value
  }
  get value() {
    //收集依赖
    // console.log('收集依赖', activeSub)
    if (activeSub) {
      collect(this, activeSub)
    }
    return this._value
  }
  set value(newValue) {
    if (hasChanged(newValue, this.value)) {
      this._value = isObject(newValue) ? reactive(newValue) : newValue
      //触发依赖
      // console.log('触发依赖')
      trigger(this)
    }
  }
}

export function isRef(value: any) {
  return !!(value && value[ReactiveFlags.IS_REF])
}

export function toRef(object, key) {
  return new ObjectRefImpl(object, key)
}

export function toRefs(object) {
  const keys = Object.keys(object)
  console.log(keys)
  // return new ObjectRefImpl(object)
}

export function proxyRefs(target) {
  return new Proxy(target, {
    get(target, key, receiver) {},
    set(target, key, newValue, receiver) {},
  })
}

class ObjectRefImpl {
  [ReactiveFlags.IS_REF] = true
  constructor(
    public _object,
    public _key,
  ) {}
  get value() {
    return this._object[this._key]
  }
  set value(newValue) {
    this._object[this._key] = newValue
  }
}
