import { collect, Link, trigger } from './system'
import { activeSub } from './effect'

const targetMap = new WeakMap() //对象的响应式关系
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

export function goCollect(target, key) {
  let keyMap = targetMap.get(target)
  if (!keyMap) {
    targetMap.set(target, (keyMap = new Map()))
  }
  let dep = keyMap.get(key)

  if (!dep) {
    keyMap.set(key, (dep = new Dep()))
  }
  if (activeSub) {
    collect(dep, activeSub)
  }
}

export function goTrigger(target, key) {
  let keyMap = targetMap.get(target)
  if (!keyMap) {
    console.log('target', target, '没有被收集过,创建新的dep')
    targetMap.set(target, (keyMap = new Map()))
  }
  let dep = keyMap.get(key)
  if (!dep) {
    console.log('keyMap上没有该键', key)
    return
  }
  trigger(dep)
}
