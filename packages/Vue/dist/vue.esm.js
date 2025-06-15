// packages/Reactivity/src/effect.ts
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
  let link = sub.depsTail?.nextDep;
  if (link) {
    sub.depsTail.nextDep = void 0;
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

// packages/Reactivity/src/system.ts
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

// packages/Reactivity/src/constance.ts
var ReactiveFlags = /* @__PURE__ */ ((ReactiveFlags2) => {
  ReactiveFlags2["IS_REF"] = "__v_isRef";
  return ReactiveFlags2;
})(ReactiveFlags || {});

// packages/Shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}
function hasChanged(newValue, oldValue) {
  return !Object.is(newValue, oldValue);
}

// packages/Reactivity/src/dep.ts
var targetMap = /* @__PURE__ */ new WeakMap();
var Dep = class {
  constructor() {
    this.subs = void 0;
    this.subsTail = void 0;
  }
};
function goCollect(target, key) {
  let keyMap = targetMap.get(target);
  if (!keyMap) {
    targetMap.set(target, keyMap = /* @__PURE__ */ new Map());
  }
  let dep = keyMap.get(key);
  if (!dep) {
    keyMap.set(key, dep = new Dep());
  }
  if (activeSub) {
    collect(dep, activeSub);
  }
}
function goTrigger(target, key) {
  let keyMap = targetMap.get(target);
  if (!keyMap) {
    console.log("target", target, "\u6CA1\u6709\u88AB\u6536\u96C6\u8FC7,\u521B\u5EFA\u65B0\u7684dep");
    targetMap.set(target, keyMap = /* @__PURE__ */ new Map());
  }
  let dep = keyMap.get(key);
  if (!dep) {
    console.log("keyMap\u4E0A\u6CA1\u6709\u8BE5\u952E", key);
    return;
  }
  trigger(dep);
}

// packages/Reactivity/src/baseHandlers.ts
var mutableHandlers = {
  get(target, key, receiver) {
    goCollect(target, key);
    const res = Reflect.get(target, key, receiver);
    if (isRef(res)) {
      return res.value;
    }
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, key, newValue, receiver) {
    const oldValue = target[key];
    const res = Reflect.set(target, key, newValue, receiver);
    if (hasChanged(oldValue, newValue)) {
      if (isRef(oldValue) && !isRef(newValue)) {
        oldValue.value = newValue;
        return res;
      }
      goTrigger(target, key);
    }
    return res;
  }
};

// packages/Reactivity/src/reactive.ts
function reactive(target) {
  return createReactiveObject(target);
}
var proxyMap = /* @__PURE__ */ new WeakMap();
var proxySet = /* @__PURE__ */ new WeakSet();
function createReactiveObject(target) {
  if (!isObject(target)) {
    console.warn(target, "\u4E0D\u662F\u5BF9\u8C61\u7C7B\u578B");
    return target;
  }
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const isReactiveProxy = proxySet.has(target);
  if (isReactiveProxy) {
    console.log("reactiveProxy", target);
    return target;
  }
  const proxy = new Proxy(target, mutableHandlers);
  proxyMap.set(target, proxy);
  proxySet.add(proxy);
  return proxy;
}

// packages/Reactivity/src/ref.ts
var ref = (value) => {
  return new RefImpl(value);
};
var _a;
_a = "__v_isRef" /* IS_REF */;
var RefImpl = class {
  constructor(value) {
    this[_a] = true;
    this._value = isObject(value) ? reactive(value) : value;
  }
  get value() {
    console.log("\u6536\u96C6\u4F9D\u8D56", activeSub);
    if (activeSub) {
      collect(this, activeSub);
    }
    return this._value;
  }
  set value(newValue) {
    this._value = isObject(newValue) ? reactive(newValue) : newValue;
    console.log("\u89E6\u53D1\u4F9D\u8D56");
    trigger(this);
  }
};
function isRef(value) {
  return !!(value && value["__v_isRef" /* IS_REF */]);
}
export {
  Dep,
  ReactiveFlags,
  ReactivityEffect,
  RefImpl,
  activeSub,
  effect,
  goCollect,
  goTrigger,
  hasChanged,
  isObject,
  isRef,
  mutableHandlers,
  reactive,
  ref
};
//# sourceMappingURL=Vue.esm.js.map
