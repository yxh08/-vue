import { collect, Link, trigger } from './system'
import { activeSub } from './effect'

export function reactive(target: any) {
  //TODO
  // if (!Object.is(target)) {
  //   return target
  // }
  return createReactiveObject(target)
}

export interface Dep {
  subs: Link | undefined
  subsTail: Link | undefined
}

export class Dep {
  subs: Link | undefined
  subsTail: Link | undefined
  constructor() {
    this.subs = undefined
    this.subsTail = undefined
  }
}

const targetMap = new WeakMap()

function createReactiveObject(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      let keyMap = targetMap.get(target)
      if (!keyMap) {
        targetMap.set(target, (keyMap = new Map()))
      }
      let dep = keyMap.get(key)

      if (!dep) {
        keyMap.set(key, (dep = new Dep()))
      }
      console.log('dep', dep)
      if (activeSub) {
        collect(dep, activeSub)
      }

      return Reflect.get(target, key)
    },
    set(target, key, newValue, receiver) {
      const res = Reflect.set(target, key, newValue)

      let keyMap = targetMap.get(target)
      if (!keyMap) {
        targetMap.set(target, (keyMap = new Map()))
      }
      let dep = keyMap.get(key)

      if (!dep) {
        keyMap.set(key, (dep = new Dep()))
      }
      console.log('dep', dep)
      trigger(dep)
      return newValue
    },
  })
}
