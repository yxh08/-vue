// packages/Reactivity/src/effect.ts
var activeSub;
function setActiveSub(value) {
  activeSub = value;
}
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
      setActiveSub(this);
      return this.fn();
    } finally {
      setActiveSub(prevActiveSub);
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
var processComputedUpdate = (computedImpl) => {
  if (computedImpl.subs && computedImpl.update()) {
    trigger(computedImpl);
  }
};
var trigger = (dep) => {
  if (dep.subs) {
    let curSub = dep.subs;
    let queue = [];
    while (curSub?.sub) {
      if ("update" in curSub.sub) {
        curSub.sub.dirty = true;
        processComputedUpdate(curSub.sub);
      } else {
        queue.push(curSub.sub);
      }
      curSub = curSub.nextSub;
    }
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
function isFunction(value) {
  return typeof value === "function";
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
    console.log("key:", key);
    if (isRef(res)) {
      return res.value;
    }
    if (isObject(res)) {
      console.log("isObject", res);
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
    if (activeSub) {
      collect(this, activeSub);
    }
    return this._value;
  }
  set value(newValue) {
    if (hasChanged(newValue, this.value)) {
      this._value = isObject(newValue) ? reactive(newValue) : newValue;
      trigger(this);
    }
  }
};
function isRef(value) {
  return !!(value && value["__v_isRef" /* IS_REF */]);
}

// packages/Reactivity/src/computed.ts
function computed(getterOrOptions) {
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedImpl(getter, setter);
}
var ComputedImpl = class {
  constructor(getter, setter) {
    this.getter = getter;
    this.setter = setter;
    this.tracking = false;
    this.dirty = true;
  }
  get value() {
    if (this.dirty) {
      this.update();
    }
    if (activeSub) {
      collect(this, activeSub);
    }
    return this._value;
  }
  set value(newValue) {
    console.log("set newValue", newValue);
    if (this.setter) {
      this.setter(newValue, this._value);
      trigger(this);
    } else {
      console.warn("\u53EA\u8BFB\u5BF9\u8C61");
    }
  }
  //单独
  update() {
    const oldValue = this._value;
    const prevActiveSub = activeSub;
    try {
      if (this.tracking) return;
      this.tracking = true;
      this.depsTail = void 0;
      setActiveSub(this);
      this._value = this.getter();
      this.dirty = false;
      return hasChanged(this._value, oldValue) ? true : false;
    } finally {
      this.tracking = false;
      setActiveSub(prevActiveSub);
      if (this.depsTail) {
        endTrack(this);
      }
    }
  }
};
export {
  Dep,
  ReactiveFlags,
  ReactivityEffect,
  RefImpl,
  activeSub,
  computed,
  effect,
  endTrack,
  goCollect,
  goTrigger,
  hasChanged,
  isFunction,
  isObject,
  isRef,
  mutableHandlers,
  reactive,
  ref,
  setActiveSub
};
//# sourceMappingURL=Vue.esm.js.map
