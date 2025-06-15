export let activeSub: ReactivityEffect

export function effect(fn: Function, effectOptions: {}) {
  const e = new ReactivityEffect(fn)
  Object.assign(e, effectOptions)
  e.run()
  const runner = () => e.run()
  runner.effect = e
  return runner
}

import type { Link } from './system'

export class ReactivityEffect {
  deps: Link | undefined = undefined
  depsTail: Link | undefined = undefined
  tracking: Boolean = false
  constructor(public fn: Function) {}
  run() {
    if (this.tracking) return
    this.tracking = true
    const prevActiveSub = activeSub
    try {
      this.depsTail = undefined
      activeSub = this
      return this.fn() //return effect的return
    } finally {
      activeSub = prevActiveSub
      this.tracking = false
      // console.count('依赖收集次数')

      //清理dep
      if (this.depsTail) {
        endTrack(this)
      }
      // console.log('清理deps', this)
    }
  }
  scheduler() {
    this.run()
  }
  notify() {
    this.scheduler()
  }
}

const endTrack = sub => {
  let link = sub.depsTail?.nextDep
  if (link) {
    sub.depsTail.nextDep = undefined
    clearDep(link)
  }
}
const clearDep = link => {
  //临时变量 保存当前节点属性的指向
  const { sub, nextSub, prevSub, dep, nextDep } = link
  /**
   * subs处理
   *  解决deps中未没有的dep的set触发effect执行问题
   * 1.操作prevSub节点的nextSub指向当前节点的下一个,
   * 2.操作nextSub节点的prevSub指向当前节点的上一个,
   * 3.当前节点的dep和sub 指向undefined
   */
  if (prevSub) {
    prevSub.nextSub = nextSub
    //清除自身prevSub的指向
    link.prevSub = undefined
  } else {
    //自身为头节点的处理
    dep.subs = nextSub
  }

  if (nextSub) {
    nextSub.prevSub = prevSub
    link.nextSub = undefined
  } else {
    //自身为尾节点的处理
    dep.subsTail = prevSub
  }

  //deps处理,断开nextDep的指向
  link.nextDep = undefined

  //清除自身的dep和sub指向
  link.dep = link.sub = undefined

  if (nextDep) {
    clearDep(nextDep)
  }
}
