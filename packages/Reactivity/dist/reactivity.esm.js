// packages/reactivity/src/effect.ts
var activeSub;
function effect(fn, effectOptions) {
  const e = new ReactivityEffect(fn);
  Object.assign(e, effectOptions);
  e.run();
  const runner = () => e.run();
  runner.effect = e;
  return runner;
}
var ReactivityEffect = class {
  constructor(fn) {
    this.fn = fn;
  }
  run() {
    const prevActiveSub = activeSub;
    try {
      this.depsTail = void 0;
      activeSub = this;
      this.fn();
    } finally {
      activeSub = prevActiveSub;
    }
  }
  scheduler() {
    this.run();
  }
  notify() {
    this.scheduler();
  }
};

// packages/reactivity/src/system.ts
var collect = (dep, sub) => {
  const currentDep = sub.deps && sub.depsTail == void 0 ? sub.deps : sub.depsTail?.nextDep;
  if (sub.deps && currentDep?.dep == dep) {
    sub.depsTail = currentDep;
    return;
  } else {
    console.log("\u672A\u88AB\u590D\u7528\u7684dep", currentDep);
  }
  const newLink = {
    sub,
    prevSub: void 0,
    nextSub: void 0,
    dep,
    nextDep: void 0
  };
  if (!sub.deps) {
    sub.deps = newLink;
    sub.depsTail = newLink;
  } else {
    sub.deps.nextDep = newLink;
    sub.depsTail = newLink;
  }
  if (!dep.subs) {
    dep.subs = newLink;
    dep.subsTail = newLink;
  } else {
    dep.subsTail.nextSub = newLink;
    newLink.prevSub = dep.subsTail;
    dep.subsTail = newLink;
  }
};
var trigger = (dep) => {
  if (dep.subs) {
    let curSub = dep.subs;
    let queue = [];
    while (curSub?.sub) {
      queue.push(curSub.sub);
      curSub = curSub.nextSub;
    }
    for (let i = 0; i <= queue.length - 1; i++) {
      queue[i].notify();
    }
  }
};

// packages/reactivity/src/ref.ts
var ref = (value) => {
  return new RefImpl(value);
};
var RefImpl = class {
  constructor(_value) {
    this._value = _value;
  }
  get value() {
    if (activeSub) {
      collect(this, activeSub);
    }
    return this._value;
  }
  set value(newValue) {
    this._value = newValue;
    trigger(this);
  }
};
export {
  ReactivityEffect,
  RefImpl,
  activeSub,
  effect,
  ref
};
//# sourceMappingURL=reactivity.esm.js.map
