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
    this.deps = void 0;
    this.depsTail = void 0;
    this.tracking = false;
  }
  run() {
    if (this.tracking) return;
    this.tracking = true;
    const prevActiveSub = activeSub;
    try {
      this.depsTail = void 0;
      activeSub = this;
      return this.fn();
    } finally {
      activeSub = prevActiveSub;
      this.tracking = false;
      if (this.depsTail) {
        endTrack(this);
      }
    }
  }
  scheduler() {
    this.run();
  }
  notify() {
    this.scheduler();
  }
};
var endTrack = (sub) => {
  console.log("sub", sub);
  let link = sub.depsTail?.nextDep;
  if (link) {
    clearDep(link);
  }
};
var clearDep = (link) => {
  const { sub, nextSub, prevSub, dep, nextDep } = link;
  if (prevSub) {
    prevSub.nextSub = nextSub;
    link.prevSub = void 0;
  } else {
    dep.subs = nextSub;
  }
  if (nextSub) {
    nextSub.prevSub = prevSub;
    link.nextSub = void 0;
  } else {
    dep.subsTail = prevSub;
  }
  link.nextDep = void 0;
  link.dep = link.sub = void 0;
  if (nextDep) {
    clearDep(nextDep);
  }
};

// packages/reactivity/src/system.ts
var collect = (dep, sub) => {
  const currentDep = sub.deps && sub.depsTail == void 0 ? sub.deps : sub.depsTail;
  if (sub.deps && sub.depsTail == void 0) {
    if (currentDep.dep == dep) {
      sub.depsTail = currentDep;
      return;
    }
  } else {
  }
  const newLink = {
    sub,
    prevSub: void 0,
    nextSub: void 0,
    dep,
    nextDep: currentDep?.nextDep
  };
  if (!sub.deps) {
    sub.deps = newLink;
    sub.depsTail = newLink;
  } else {
    sub.depsTail.nextDep = newLink;
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
    console.log("\u5F85\u6267\u884C\u961F\u5217", queue);
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

// packages/reactivity/src/reactive.ts
function reactive(target) {
  return createReactiveObject(target);
}
var Dep = class {
  constructor() {
    this.subs = void 0;
    this.subsTail = void 0;
  }
};
var targetMap = /* @__PURE__ */ new WeakMap();
function createReactiveObject(target) {
  return new Proxy(target, {
    get(target2, key, receiver) {
      let keyMap = targetMap.get(target2);
      if (!keyMap) {
        targetMap.set(target2, keyMap = /* @__PURE__ */ new Map());
      }
      let dep = keyMap.get(key);
      if (!dep) {
        keyMap.set(key, dep = new Dep());
      }
      console.log("dep", dep);
      if (activeSub) {
        collect(dep, activeSub);
      }
      return Reflect.get(target2, key);
    },
    set(target2, key, newValue, receiver) {
      const res = Reflect.set(target2, key, newValue);
      let keyMap = targetMap.get(target2);
      if (!keyMap) {
        targetMap.set(target2, keyMap = /* @__PURE__ */ new Map());
      }
      let dep = keyMap.get(key);
      if (!dep) {
        keyMap.set(key, dep = new Dep());
      }
      console.log("dep", dep);
      trigger(dep);
      return newValue;
    }
  });
}
export {
  Dep,
  ReactivityEffect,
  RefImpl,
  activeSub,
  effect,
  reactive,
  ref
};
//# sourceMappingURL=reactivity.esm.js.map
