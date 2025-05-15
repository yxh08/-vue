import { activeSub } from './effect'

export const ref = value => {
  return new RefImpl(value)
}
class RefImpl {
  headSub: undefined
  tailSub: undefined
  constructor(public _value) {}
  get value() {
    //收集依赖
    if (activeSub) {
      collect(this)
    }
    return this._value
  }
  set value(newValue) {
    this._value = newValue
    //触发依赖
    trigger(this)
  }
}

interface SubNode {
  prevSub: SubNode | undefined
  sub: Function | ReactivityEffect
  nextSub: SubNode | undefined
}

//收集依赖
export const collect = refObj => {
  const newSub: SubNode = {
    prevSub: undefined,
    sub: activeSub,
    nextSub: undefined,
  }

  if (!refObj.headSub) {
    refObj.headSub = newSub
    refObj.tailSub = newSub
  } else {
    refObj.tailSub.nextSub = newSub
    newSub.prevSub = refObj.tailSub
    refObj.tailSub = newSub
  }
}

//触发依赖
export const trigger = refObj => {
  if (refObj.headSub) {
    let curSub = refObj.headSub
    let queue = []
    while (curSub?.sub) {
      queue.push(curSub.sub)
      curSub = curSub.nextSub
    }
    console.log('待执行队列', queue)
    for (let i = 0; i <= queue.length - 1; i++) {
      queue[i].run()
    }
  }
}
