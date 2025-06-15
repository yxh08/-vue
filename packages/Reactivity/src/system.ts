//依赖项
import { ReactivityEffect } from './effect'

export interface Dependcy {
  subs: Link
  subsTail: Link | undefined
}
//依赖项
export interface Sub extends ReactivityEffect {
  deps: Link
  depsTail: Link | undefined
}

export interface Link {
  sub: Sub
  nextSub: Link | undefined
  prevSub: Link | undefined
  dep: Dependcy
  nextDep: Link | undefined
}

//依赖收集 与 分支切换

/**
 *  @Param dep 依赖项 RefImpl
 *  @Param sub 订阅者 ReactivityEffect
 */
export const collect = (dep, sub) => {
  /**
   * 避免依赖重复收集
   *  如果sub.deps存在并且sub.depsTail = undefined
   *   那么就是再次执行run(第一次的时候已经收集过一遍依赖),
   *    需要判断一下是否是重复收集依赖(有可能是分支切换,需要的依赖不同)
   */

  const currentDep =
    sub.deps && sub.depsTail == undefined ? sub.deps : sub.depsTail
  // console.log(dep)
  // 依赖收集
  if (sub.deps && sub.depsTail == undefined) {
    //再次收集头节点
    if (currentDep.dep == dep) {
      // console.log('复用节点', currentDep)
      sub.depsTail = currentDep
      return
    }
  } else {
    // console.log('未复用的节点', currentDep)
  }

  const newLink: Link = {
    sub,
    prevSub: undefined,
    nextSub: undefined,
    dep,
    nextDep: currentDep?.nextDep,
  }

  if (!sub.deps) {
    sub.deps = newLink
    sub.depsTail = newLink
  } else {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  }

  if (!dep.subs) {
    dep.subs = newLink
    dep.subsTail = newLink
  } else {
    dep.subsTail!.nextSub = newLink
    newLink.prevSub = dep.subsTail
    dep.subsTail = newLink
  }

  // console.log('dep', dep)
  // console.log('sub', sub)
}

/**
 * 触发依赖
 * @param dep
 */
export const trigger = (dep: any) => {
  if (dep.subs) {
    let curSub: Link | undefined = dep.subs
    let queue: ReactivityEffect[] = []
    while (curSub?.sub) {
      queue.push(curSub.sub as ReactivityEffect)
      curSub = curSub.nextSub
    }
    console.log('待执行队列', queue)
    for (let i = 0; i <= queue.length - 1; i++) {
      queue[i].notify()
    }
  }
}
