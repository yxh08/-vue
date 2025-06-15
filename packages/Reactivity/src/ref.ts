import { activeSub } from './effect'
import { collect, Link, trigger } from './system'
import { ReactiveFlags } from './constance'
import { reactive } from './reactive'
import { isObject } from '../../Shared/src/index'

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
    console.log('收集依赖', activeSub)
    if (activeSub) {
      collect(this, activeSub)
    }
    return this._value
  }
  set value(newValue) {
    this._value = isObject(newValue) ? reactive(newValue) : newValue
    //触发依赖
    console.log('触发依赖')
    trigger(this)
  }
}

export function isRef(value) {
  return !!(value && value[ReactiveFlags.IS_REF])
}
