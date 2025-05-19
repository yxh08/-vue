import { activeSub } from './effect';
import { ReactivityEffect } from './effect';
import { RefImpl } from './ref';

export interface SubNode {
  prevSub: SubNode | undefined;
  sub: ReactivityEffect;
  nextSub: SubNode | undefined;
}

export interface DepNode {
  dep: SubNode;
  nextDep: DepNode | undefined;
}

//收集依赖
export const collect = (refObj: RefImpl, effectObj: ReactivityEffect) => {
  //
  const newSub: SubNode = {
    prevSub: undefined,
    sub: effectObj,
    nextSub: undefined,
  };

  //
  const newDep: DepNode = {
    dep: newSub,
    nextDep: undefined,
  };

  if (!effectObj.headDep) {
    effectObj.headDep = newDep;
  } else if (effectObj.headDep) {
  }

  if (!refObj.headSub) {
    refObj.headSub = newSub;
    refObj.tailSub = newSub;
  } else {
    refObj.tailSub!.nextSub = newSub;
    newSub.prevSub = refObj.tailSub;
    refObj.tailSub = newSub;
  }
};

//触发依赖
export const trigger = (refObj: RefImpl) => {
  if (refObj.headSub) {
    let curSub = refObj.headSub;
    let queue = [];
    while (curSub?.sub) {
      queue.push(curSub.sub);
      curSub = curSub.nextSub!;
    }
    console.log('待执行队列', queue);
    for (let i = 0; i <= queue.length - 1; i++) {
      queue[i].run();
    }
  }
};
