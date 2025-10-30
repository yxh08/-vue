// packages/runtime-dom/src/nodeOps.ts
var nodeOps = {
  //插入节点
  insert(el, parent, anchor) {
    parent.insertBefore(el, anchor || null);
  },
  //移除元素
  remove(el) {
    const parentNode = el.parentNode;
    if (parentNode) {
      parentNode.removeChild(el);
    }
  },
  createElement(tag) {
    return document.createElement(tag);
  },
  //设置元素的text
  setElementText(el, text) {
    el.textContent = text;
  },
  //创建文本节点
  createText(text) {
    return document.createTextNode(text);
  },
  //设置nodeValue
  setText(node, text) {
    return node.nodeValue = text;
  },
  //获取父节点
  parentNode(el) {
    return el.parentNode;
  },
  //获取下一个兄弟节点
  nextSibling(el) {
    return el.nextSibling;
  },
  //获取元素
  querySelector(selector) {
    return document.querySelector(selector);
  }
};

// packages/runtime-dom/src/module/patchAttr.ts
function patchAttr(el, prop, prevValue, nextValue) {
  if (!nextValue) {
    return el?.removeAttribute(prop);
  }
  el?.setAttribute(prop, nextValue);
}

// packages/runtime-dom/src/module/patchStyle.ts
function patchStyle(el, prevValue, nextValue) {
  if (nextValue) {
    for (const styleName in nextValue) {
      el.style[styleName] = nextValue[styleName];
    }
  }
  if (prevValue) {
    for (const key in prevValue) {
      if (nextValue?.[key] == null) {
        el.style[key] = null;
      }
    }
  }
}

// packages/runtime-dom/src/module/patchClass.ts
function patchClass(el, prevValue, nextValue) {
  if (nextValue == void 0) {
    el.removeAttribute("class");
  } else {
    el.className = nextValue;
  }
}

// packages/runtime-dom/src/module/Event.ts
var createInvoker = (nextValue) => {
  const Invoker = (e) => {
    Invoker.value(e);
  };
  Invoker.value = nextValue;
  return Invoker;
};
var vei = "vei";
function patchEvent(el, eventName, prevValue, nextValue) {
  const rawName = eventName.slice(2).toLowerCase();
  el[vei] ??= {};
  let Invoker = el[vei][rawName];
  if (Invoker) {
    if (nextValue) Invoker.value = nextValue;
  } else {
    if (nextValue) {
      Invoker = createInvoker(nextValue);
      el[vei][rawName] = Invoker;
      el.addEventListener(rawName, Invoker);
    } else {
      el.removeEventListener(rawName, Invoker);
    }
  }
}

// packages/shared/src/utils.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}
function hasChanged(newValue, oldValue) {
  return !Object.is(newValue, oldValue);
}
function isFunction(value) {
  return typeof value === "function";
}
function isEvent(propName) {
  return /^on[A-Z]/.test(propName);
}
function isVNode(value) {
  return value?.__v_isVNode;
}
function isArray(value) {
  return Array.isArray(value);
}
function isString(value) {
  return typeof value === "string";
}
function isNumber(value) {
  return typeof value === "number";
}
function isSameVNodeType(n1, n2) {
  return n1.type === n2?.type && n1.key === n2?.key;
}

// packages/runtime-dom/src/patchProp.ts
function patchProp(el, key, preValue, nextValue) {
  if (key == "style") {
    return patchStyle(el, preValue, nextValue);
  }
  if (key == "class") {
    return patchClass(el, preValue, nextValue);
  }
  if (isEvent(key)) {
    return patchEvent(el, key, preValue, nextValue);
  }
  return patchAttr(el, key, preValue, nextValue);
}

// packages/reactivity/src/effect.ts
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
  }
  deps = void 0;
  depsTail = void 0;
  tracking = false;
  dirty = false;
  run() {
    if (this.tracking) return;
    this.tracking = true;
    const prevActiveSub = activeSub;
    try {
      this.depsTail = void 0;
      setActiveSub(this);
      return this.fn();
    } finally {
      endTrack(this);
      setActiveSub(prevActiveSub);
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
  sub.tracking = false;
  sub.dirty = false;
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
      if (!curSub.sub.dirty && !curSub.sub.tracking) {
        curSub.sub.dirty = true;
        if ("update" in curSub.sub) {
          processComputedUpdate(curSub.sub);
        } else {
          queue.push(curSub.sub);
        }
      }
      curSub = curSub.nextSub;
    }
    for (let i = 0; i <= queue.length - 1; i++) {
      queue[i].notify();
    }
  }
};

// packages/reactivity/src/constance.ts
var ReactiveFlags = /* @__PURE__ */ ((ReactiveFlags2) => {
  ReactiveFlags2["IS_REF"] = "__v_isRef";
  return ReactiveFlags2;
})(ReactiveFlags || {});

// packages/reactivity/src/dep.ts
var targetMap = /* @__PURE__ */ new WeakMap();
var Dep = class {
  subs;
  subsTail;
  target;
  key;
  constructor(target, key) {
    this.subs = void 0;
    this.subsTail = void 0;
    this.target = target;
    this.key = key;
  }
};
function goCollect(target, key) {
  let keyMap = targetMap.get(target);
  if (!keyMap) {
    targetMap.set(target, keyMap = /* @__PURE__ */ new Map());
  }
  let dep = keyMap.get(key);
  if (!dep) {
    keyMap.set(key, dep = new Dep(target, key));
  }
  if (activeSub) {
    console.log("dep", dep, activeSub);
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

// packages/reactivity/src/baseHandlers.ts
var mutableHandlers = {
  get(target, key, receiver) {
    console.log("goCollect", target, key);
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

// packages/reactivity/src/reactive.ts
function reactive(target) {
  return createReactiveObject(target);
}
function isReactive(obj) {
  return !!proxyMap.get(obj);
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

// packages/reactivity/src/ref.ts
var ref = (value) => {
  return new RefImpl(value);
};
var RefImpl = class {
  subs;
  subsTail;
  ["__v_isRef" /* IS_REF */] = true;
  _value;
  constructor(value) {
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
function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}
function toRefs(target) {
  const obj = {};
  if (!isObject(target)) return target;
  for (let key in target) {
    obj[key] = new ObjectRefImpl(target, key);
  }
  return obj;
}
function unRef(value) {
  if (isRef(value)) {
    return value.value;
  } else {
    return value;
  }
}
function proxyRefs(target) {
  return new Proxy(target, {
    get(...args) {
      const res = Reflect.get(...args);
      return unRef(res);
    },
    set(target2, key, newValue, receiver) {
      const oldValue = target2[key];
      if (isRef(oldValue) && !isRef(newValue)) {
        oldValue.value = newValue;
        return true;
      }
      return Reflect.set(target2, key, newValue, receiver);
    }
  });
}
var ObjectRefImpl = class {
  constructor(_object, _key) {
    this._object = _object;
    this._key = _key;
  }
  ["__v_isRef" /* IS_REF */] = true;
  get value() {
    return this._object[this._key];
  }
  set value(newValue) {
    this._object[this._key] = newValue;
  }
};

// packages/reactivity/src/computed.ts
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
  }
  _value;
  // 作为dep
  subs;
  subsTail;
  //作为sub
  deps;
  depsTail;
  tracking = false;
  dirty = true;
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

// packages/reactivity/src/watch.ts
function watch(source, cb, options = { deep: false }) {
  let { deep } = options;
  let getter;
  if (isRef(source)) {
    getter = () => source.value;
  } else if (isReactive(source)) {
    if (deep) {
      deep = deep === true ? Infinity : deep;
    } else {
      deep = true;
    }
    getter = () => source;
  } else if (isFunction(source)) {
    getter = source;
  }
  if (deep) {
    let dept = deep === true ? Infinity : deep;
    const baseGetter = getter;
    getter = function() {
      const value = baseGetter();
      deepGet(value, dept);
      return value;
    };
  }
  let oldValue;
  const effect2 = new ReactivityEffect(getter);
  oldValue = effect2.run();
  effect2.scheduler = job;
  function job() {
    const newValue = getter();
    cb(newValue, oldValue);
    oldValue = newValue;
  }
}
function deepGet(value, dept, seen = /* @__PURE__ */ new Set()) {
  if (!isObject(value) || dept <= 0) {
    return;
  }
  if (seen.has(value)) {
    return;
  } else {
    seen.add(value);
    for (const key in value) {
      dept--;
      deepGet(value[key], dept, seen);
    }
  }
}

// packages/runtime-core/src/scheduler.ts
function createSchedulerFn(instance, fn) {
  return () => fn(instance);
}
function nextTick(fn) {
  return Promise.resolve().then(fn);
}

// packages/runtime-core/src/components/KeepAlive.ts
function isKeepAlive(vnode) {
  return vnode.type.__isKeepAlive;
}
var KeepAlive = {
  props: ["max", "includes", "excludes"],
  name: "KeepAlive",
  __isKeepAlive: true,
  setup(props, { slots }) {
    const cache = new LRU(props.max || Infinity);
    const vm = getCurrentInstance();
    const { createElement, insert, unmount } = vm.ctx.renderer.options;
    vm.ctx.deactivate = (vnode) => {
      const dv = createElement("div");
      insert(vnode.el, dv);
      vnode.shapeFlag |= 512 /* COMPONENT_KEPT_ALIVE */;
    };
    vm.ctx.activate = (vnode, container, anchor) => {
      if (vnode) {
        insert(vnode.el, container, anchor);
      }
    };
    return () => {
      let vnode = slots.default();
      const key = vnode.key != null ? vnode.key : vnode.type;
      if (cache.get(key)) {
        const cachedVNode = cache.get(key);
        vnode.component = cachedVNode.component;
        vnode.el = cachedVNode.el;
        vnode.shapeFlag = cachedVNode.shapeFlag;
        return vnode;
      }
      if (true) {
        vnode.shapeFlag |= 256 /* COMPONENT_SHOULD_KEEP_ALIVE */;
        const key2 = vnode.key != null ? vnode.key : vnode.type;
        const shouldUnmountVNode = cache.set(key2, vnode);
        if (shouldUnmountVNode) {
          shouldUnmountVNode.shapeFlag &= ~512 /* COMPONENT_KEPT_ALIVE */;
          shouldUnmountVNode.shapeFlag &= ~256 /* COMPONENT_SHOULD_KEEP_ALIVE */;
          unmount(shouldUnmountVNode);
        }
      }
      return vnode;
    };
  }
};
var LRU = class {
  max;
  store = /* @__PURE__ */ new Map();
  constructor(max = Infinity) {
    this.max = max;
  }
  get(key) {
    return this.store.get(key);
  }
  set(key, vnode) {
    let shouldUnmountVNode;
    const existingVNode = this.get(key);
    if (existingVNode) {
      this.deleteOldest();
    } else {
      if (this.store.size >= this.max) {
        shouldUnmountVNode = this.deleteOldest();
      }
    }
    this.store.set(key, vnode);
    return shouldUnmountVNode;
  }
  deleteOldest() {
    const { value: key } = this.store.keys().next();
    const vnode = this.get(key);
    this.store.delete(key);
    return vnode;
  }
};

// packages/runtime-core/src/component.ts
var publicPropertiesMap = {
  $attrs: (instance) => instance.attrs,
  $refs: (instance) => instance.refs,
  $props: (instance) => instance.props,
  $slots: (instance) => instance.slots,
  $emit: (instance) => emit.bind(null, instance),
  $nextTick: (instance) => nextTick.bind(instance),
  $el: (instance) => instance.vnode.el
};
function createComponentInstance(vnode, parent, options) {
  const appContext = parent ? parent.appContext : vnode.appContext;
  const instance = {
    type: vnode.type,
    vnode,
    parent,
    props: {},
    attrs: {},
    slots: {},
    render: null,
    setupState: {},
    subTree: null,
    isMounted: false,
    proxy: null,
    refs: {},
    appContext,
    provides: Object.create(parent ? parent.provides : appContext.provides)
  };
  instance.ctx = { _: instance };
  setFullProps(vnode, instance, instance.props, instance.attrs);
  initSlots(instance);
  if (isKeepAlive(vnode)) {
    instance.ctx.renderer = { options: { ...options } };
  }
  setupComponent(instance);
  instance.proxy = new Proxy(instance.ctx, componentProxyGetter);
  return instance;
}
function initSlots(instance) {
  const { vnode } = instance;
  const { shapeFlag, children } = vnode;
  if (shapeFlag & 32 /* SLOTS_CHILDREN */ && isObject(children)) {
    for (const slotName in children) {
      instance.slots[slotName] = children[slotName];
    }
    for (const slotName in instance.slots) {
      if (!children[slotName]) {
        delete instance.slots[slotName];
      }
    }
  }
}
function setupComponent(instance) {
  const { type } = instance;
  const { shapeFlag } = instance.vnode;
  if (shapeFlag & 4 /* STATEFUL_COMPONENT */) {
    if (isFunction(type.setup)) {
      const setupContext = createSetupContext(instance);
      instance.setupContext = setupContext;
      setCurrentInstance(instance);
      const setupResult = type.setup(instance.props, setupContext);
      unsetCurrentInstance();
      if (isFunction(setupResult)) {
        instance.render = setupResult;
      } else if (isObject(setupResult)) {
        instance.setupState = proxyRefs(setupResult || {});
        instance.render = type.render;
      } else {
      }
    } else {
      instance.render = type.render;
    }
  } else {
    instance.render = () => type(instance.props, {
      attrs: instance.attrs,
      emit(event, ...args) {
        emit(instance, event, ...args);
      },
      slots: instance.slots
    });
  }
}
var createSetupContext = (instance) => {
  return {
    get attrs() {
      return instance.attrs;
    },
    emit(event, ...args) {
      emit(instance, event, ...args);
    },
    slots: instance.slots,
    expose(exposed) {
      instance.exposed = exposed;
    }
  };
};
function emit(instance, event, ...args) {
  const rawProps = instance.vnode.props;
  const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
  if (rawProps[eventName]) {
    rawProps[eventName](...args);
  }
}
function getComponentPublicInstance(instance) {
  if (instance.exposed) {
    return instance.exposeProxy ??= new Proxy(instance.exposed, {
      get(target, key) {
        if (key in target) {
          return target[key];
        }
        if (key in publicPropertiesMap) {
          return publicPropertiesMap[key](instance);
        }
      }
    });
  } else {
    return instance.proxy;
  }
}
function setFullProps(vnode, instance, props, attrs) {
  const { shapeFlag } = vnode;
  const rawProps = vnode.props;
  if (vnode.type.props && Object.keys(vnode.type.props).length) {
    const definedProps = normalizeProps(vnode.type.props);
    for (let key in rawProps) {
      if (Object.hasOwn(definedProps, key)) {
        props[key] = rawProps[key];
      } else {
        attrs[key] = rawProps[key];
      }
    }
  } else {
    if (shapeFlag & 2 /* FUNCTIONAL_COMPONENT */) {
      for (let key in rawProps) {
        props[key] = rawProps[key];
      }
    } else {
      for (let key in rawProps) {
        attrs[key] = rawProps[key];
      }
    }
  }
  instance.props = props;
  instance.attrs = attrs;
}
function normalizeProps(props) {
  if (isArray(props)) {
    return props.reduce((objProps, cur) => {
      objProps[cur] = {};
      return objProps;
    }, {});
  } else {
    return props;
  }
}
var componentProxyGetter = {
  get(_target, key, receiver) {
    const target = _target._;
    console.log("target, key, receiver ===>", target, key, receiver);
    const setupState = target.setupState;
    const props = target.props;
    if (Object.hasOwn(setupState, key)) {
      return setupState[key];
    } else if (Object.hasOwn(props, key)) {
      return props[key];
    }
    if (Object.hasOwn(publicPropertiesMap, key)) {
      const publicGetter = publicPropertiesMap[key];
      if (isFunction(publicGetter)) {
        return publicPropertiesMap[key](target);
      }
    }
    return target[key];
  },
  set(target, key, newValue, receiver) {
    const setupState = target.setupState;
    const props = target.props;
    if (Object.hasOwn(setupState, key)) {
      setupState[key] = newValue;
      return true;
    } else if (Object.hasOwn(props, key)) {
      console.warn("readOnly props", key);
      return true;
    }
    return true;
  }
};
var currentInstance = null;
function setCurrentInstance(instance) {
  currentInstance = instance;
}
function getCurrentInstance() {
  return currentInstance;
}
function unsetCurrentInstance() {
  currentInstance = null;
}
var renderingInstance = null;
function setRenderingInstance(instance) {
  renderingInstance = instance;
}
function getRenderingInstance() {
  return renderingInstance;
}

// packages/runtime-core/src/components/Teleport.ts
function isTeleport(type) {
  return type.__isTeleport;
}
var Teleport = {
  name: "Teleport",
  __isTeleport: true,
  props: {},
  process(n1, n2, container, anchor, parentComponent, mountChildren, patchChildren, options) {
    const { querySelector, insert } = options;
    const { disabled, to } = n2.props;
    const target = disabled ? container : querySelector(to);
    if (n1 == null) {
      if (target) {
        mountChildren(n2.children, target, parentComponent);
        n2.target = target;
      }
    } else {
      patchChildren(n1, n2, n1.target, parentComponent);
      if (n1.target !== target) {
        console.log("n1 ===>", n1);
        for (const vnode of n1.children) {
          insert(vnode.el, target, null);
        }
      }
      n2.target = target;
    }
  }
};

// packages/runtime-core/src/vnode.ts
function normalizeVNode(vnode) {
  if (isString(vnode) || isNumber(vnode)) {
    return createVNode(Text, null, String(vnode));
  }
  return vnode;
}
var Text = Symbol("v-txt");
function createVNode(type, props, children) {
  let shapeFlag = 0;
  if (isString(type)) {
    shapeFlag = 1 /* ELEMENT */;
    if (isString(children) || isNumber(children)) {
      shapeFlag |= 8 /* TEXT_CHILDREN */;
    } else if (isArray(children)) {
      shapeFlag |= 16 /* ARRAY_CHILDREN */;
    }
  } else {
    if (isTeleport(type)) {
      shapeFlag = 64 /* TELEPORT */;
    } else if (isObject(type)) {
      shapeFlag = 4 /* STATEFUL_COMPONENT */;
    } else if (isFunction(type)) {
      shapeFlag |= 2 /* FUNCTIONAL_COMPONENT */;
    }
    if (isString(children) || isNumber(children)) {
      shapeFlag |= 8 /* TEXT_CHILDREN */;
    } else if (isArray(children)) {
      shapeFlag |= 16 /* ARRAY_CHILDREN */;
    } else if (isObject(children)) {
      shapeFlag |= 32 /* SLOTS_CHILDREN */;
    } else if (isFunction(children)) {
      shapeFlag |= 32 /* SLOTS_CHILDREN */;
      children = { default: children };
    }
  }
  const vnode = {
    __v_isVNode: true,
    type,
    props,
    children,
    //需要挂载的目标元素
    el: null,
    // 做diff用
    key: props?.key,
    shapeFlag,
    ref: normalizeRef(props?.ref),
    appContext: null
  };
  return vnode;
}
function normalizeRef(ref2) {
  if (!ref2) return ref2;
  return {
    r: ref2,
    i: getRenderingInstance()
  };
}

// packages/runtime-core/src/h.ts
function h(type, propsOrChildren, children) {
  let l = arguments.length;
  if (l === 2) {
    if (isArray(propsOrChildren)) {
      return createVNode(type, null, propsOrChildren);
    }
    if (isObject(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      } else {
        return createVNode(type, propsOrChildren);
      }
    }
    return createVNode(type, null, propsOrChildren);
  } else {
    if (l > 3) {
      return createVNode(type, propsOrChildren, [...arguments.slice(2)]);
    } else {
      if (isVNode(children)) {
        return createVNode(type, propsOrChildren, [children]);
      }
      return createVNode(type, propsOrChildren, children);
    }
  }
}

// packages/runtime-core/src/apiCreateApp.ts
function createAppAPI(render2) {
  return function createApp2(rootComponent, rootProps) {
    const context = {
      //app 往后代组件使用provide 注入的属性
      provides: {}
    };
    const app = {
      _container: null,
      mount(container) {
        const vnode = h(rootComponent, rootProps);
        vnode.appContext = context;
        render2(vnode, container);
        app._container = container;
      },
      unmount() {
        render2(null, app._container);
      },
      provide(key, value) {
        context.provides[key] = value;
      }
    };
    return app;
  };
}

// packages/runtime-core/src/renderer.ts
function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    createText: hostCreateText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp
  } = options;
  const mountChildren = (children, el, parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i] = normalizeVNode(children[i]);
      patch(null, child, el, null, parentComponent);
    }
  };
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      unmount(child);
    }
  };
  const unmount = (vnode) => {
    const { type, shapeFlag, children, ref: ref2, component } = vnode;
    if (shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
      component.parent.ctx.deactivate(vnode);
      return;
    }
    if (shapeFlag & 6 /* COMPONENT */) {
      const instance = vnode.component;
      triggerLifeCycle(instance, "bum");
    }
    if (shapeFlag & 6 /* COMPONENT */) {
      unmount(vnode.component.subTree);
    } else if (isTeleport(vnode.type)) {
      unmountChildren(children);
      return;
    } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      unmountChildren(children);
    }
    if (ref2 != null) {
      setRef(ref2, vnode);
    }
    if (vnode.transition) {
      const remove = () => hostRemove(vnode.el);
      vnode.transition?.beforeLeave(vnode.el, remove);
    } else {
      hostRemove(vnode.el);
    }
    if (shapeFlag & 6 /* COMPONENT */) {
      const instance = vnode.component;
      triggerLifeCycle(instance, "um");
    }
  };
  const mountElement = (vnode, container, anchor = null, parentComponent) => {
    const { type, props, children, shapeFlag } = vnode;
    const el = hostCreateElement(type);
    vnode.el = el;
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      hostSetElementText(el, children);
    } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      mountChildren(children, el, parentComponent);
    }
    if (vnode.transition) {
      vnode.transition?.beforeEnter(vnode.el);
    }
    hostInsert(el, container, anchor);
    if (vnode.transition) {
      vnode.transition?.enter(vnode.el);
    }
  };
  const patchProps = (el, oldProps, newProps) => {
    if (oldProps) {
      for (const key in oldProps) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
    if (newProps) {
      for (const key in newProps) {
        hostPatchProp(el, key, oldProps?.[key], newProps[key]);
      }
    }
  };
  const patchKeyedChildren = (c1, c2, el, parentComponent) => {
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    let i = 0;
    while (i <= e1 && i <= e2) {
      if (isSameVNodeType(c1[i], c2[i])) {
        patch(c1[i], c2[i], el, null, parentComponent);
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      if (isSameVNodeType(c1[e1], c2[e2])) {
        patch(c1[e1], c2[e2], el, null, parentComponent);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e2) {
      while (i <= e1) {
        unmount(c1[e1]);
        e1--;
      }
    } else if (i > e1) {
      while (i <= e2) {
        console.log("anchor", c2[e2 + 1]);
        console.log("new", c2[e2]);
        patch(null, c2[e2], el, c2[e2 + 1].el, parentComponent);
        e2--;
      }
    } else {
      const keymap = /* @__PURE__ */ new Map();
      for (let s = i; s <= e2; s++) {
        const { key } = c2[s];
        if (key) {
          keymap.set(key, s);
        }
      }
      console.log("keymap", keymap);
      let newToOldIndex = [];
      let moved = false;
      let startIndex = -1;
      for (let s = i; s <= e1; s++) {
        const { key } = c1[s];
        if (keymap.has(key) && isSameVNodeType(c1[s], c2[keymap.get(key)])) {
          patch(c1[s], c2[keymap.get(key)], el, null, parentComponent);
          newToOldIndex.push(keymap.get(key));
          if (keymap.get(key) < startIndex) {
            moved = true;
          }
          startIndex = keymap.get(key);
        } else {
          unmount(c1[s]);
        }
      }
      const res = getLongestArr(newToOldIndex);
      for (let s = e2; s >= i; s--) {
        const anchor = c2[s + 1]?.el || null;
        if (c2[s].el && moved) {
          if (!res.includes(s)) continue;
          hostInsert(c2[s].el, el, anchor);
        } else {
          patch(null, c2[s], el, anchor, parentComponent);
        }
      }
    }
  };
  const patchChildren = (n1, n2, el, parentComponent) => {
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        unmountChildren(n1.children);
      }
      if (n1.children !== n2.children) {
        hostSetElementText(el, n2.children);
      }
    } else {
      if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(el, "");
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          mountChildren(n2.children, el, parentComponent);
        }
      } else {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            for (let key in n2.children) {
              n2.children[key] = normalizeVNode(n2.children[key]);
            }
            patchKeyedChildren(n1.children, n2.children, el, parentComponent);
          } else {
            unmountChildren(n1.children);
          }
        } else {
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(n2.children, el, parentComponent);
          }
        }
      }
    }
  };
  const patchElement = (n1, n2, parentComponent) => {
    const el = n2.el = n1.el;
    const oldProps = n1.props;
    const newProps = n2.props;
    patchProps(el, oldProps, newProps);
    patchChildren(n1, n2, el, parentComponent);
  };
  function processText(n1, n2, container, anchor) {
    if (n1 == null) {
      const el = hostCreateText(n2.children);
      n2.el = el;
      hostInsert(el, container, anchor);
    } else {
      n2.el = n1.el;
      if (n1.children !== n2.children) {
        hostSetText(n2.el, n2.children);
      }
    }
  }
  function processElement(n1, n2, container, anchor, parentComponent) {
    if (n1 == null) {
      mountElement(n2, container, anchor, parentComponent);
    } else {
      patchElement(n1, n2, parentComponent);
    }
  }
  function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    setFullProps(nextVNode, instance, instance.props, instance.attrs);
    initSlots(instance);
  }
  function shouldUpdateComponent(n1, n2) {
    const { props: prevProps, children: prevChildren } = n1;
    const { props: nextProps, children: nextChildren } = n2;
    if (prevChildren || nextChildren) {
      return true;
    }
    if (!prevProps) {
      return !!nextProps;
    }
    if (prevProps && !nextProps) {
      return true;
    }
    const nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(prevProps).length) {
      return true;
    }
    for (const key of nextKeys) {
      if (nextProps[key] !== prevProps[key]) {
        return true;
      }
    }
    return false;
  }
  function updateComponent(n1, n2) {
    const instance = n2.component = n1.component;
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      console.log("n1,n2 ===>", n1, n2);
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }
  function processComponent(n1, n2, container, anchor, parentComponent) {
    if (n1 === null) {
      const { shapeFlag } = n2;
      if (shapeFlag & 512 /* COMPONENT_KEPT_ALIVE */) {
        n2.component.parent.ctx.activate(n2, container, anchor);
        return;
      }
      const instance = createComponentInstance(n2, parentComponent, {
        ...options,
        unmount
      });
      n2.component = instance;
      const schedulerFn = createSchedulerFn(instance, function(instance2) {
        if (!instance2.isMounted) {
          triggerLifeCycle(instance2, "bm");
          setRenderingInstance(instance2);
          const subTree = instance2.render.call(instance2.proxy);
          setRenderingInstance(null);
          patch(null, subTree, container, anchor, instance2);
          n2.el = subTree?.el;
          instance2.isMounted = true;
          instance2.subTree = subTree;
          triggerLifeCycle(instance2, "m");
        } else {
          let { next, vnode } = instance2;
          triggerLifeCycle(instance2, "bu");
          if (next) {
            updateComponentPreRender(instance2, next);
          } else {
            next = vnode;
          }
          const prevSubTree = instance2.subTree;
          setRenderingInstance(instance2);
          const subTree = instance2.render.call(instance2.proxy);
          console.log("subTree ===>", subTree);
          setRenderingInstance(null);
          patch(prevSubTree, subTree, container, anchor, instance2);
          next.el = subTree?.el;
          instance2.subTree = subTree;
          triggerLifeCycle(instance2, "u");
        }
      });
      const effect2 = new ReactivityEffect(schedulerFn);
      instance.update = effect2.run.bind(effect2);
      effect2.scheduler = () => Promise.resolve().then(instance.update);
      effect2.run();
    } else {
      updateComponent(n1, n2);
    }
  }
  const patch = (n1, n2, container, anchor = null, parentComponent) => {
    if (n1 === n2) return;
    if (n1 && !isSameVNodeType(n1, n2)) {
      anchor = hostNextSibling(n1.el);
      unmount(n1);
      n1 = null;
    }
    if (!n2) return;
    const { type, shapeFlag, ref: ref2 } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor);
        break;
      default:
        if (shapeFlag & 1 /* ELEMENT */) {
          processElement(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & 6 /* COMPONENT */) {
          processComponent(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & 64 /* TELEPORT */) {
          type.process(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            mountChildren,
            patchChildren,
            options
          );
        }
    }
    setRef(ref2, n2);
  };
  const render2 = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      patch(container._vnode || null, vnode, container, null);
    }
    container._vnode = vnode;
  };
  return {
    render: render2,
    createApp: createAppAPI(render2)
  };
}
function getLongestArr(list) {
  const res = [];
  let itemPrevMap = {};
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (res.length == 0) {
      res.push(item);
    } else if (item > res[res.length - 1]) {
      itemPrevMap[item] = res[res.length - 1];
      res.push(item);
    } else {
      const target = findItem(res, item);
      const targetIndex = res.findIndex((x) => x == target);
      res.splice(targetIndex, 1, item);
      if (targetIndex - 1 >= 0) {
        itemPrevMap[item] = res[targetIndex - 1];
      }
    }
  }
  let result = [];
  let current = res[res.length - 1];
  result.push(current);
  while (itemPrevMap[current]) {
    result.push(itemPrevMap[current]);
    current = itemPrevMap[current];
  }
  return result.reverse();
}
function findItem(res, targetNumber) {
  let mid = Math.floor(res.length / 2);
  if (res[0] > targetNumber) {
    return res[0];
  } else if (res[mid] < targetNumber && res[mid + 1] > targetNumber) {
    return res[mid + 1];
  } else if (res[mid] > targetNumber) {
    if (res[mid] > targetNumber && res[mid - 1] < targetNumber) {
      return res[mid];
    } else {
      return findItem(res.slice(0, mid + 1), targetNumber);
    }
  } else {
    if (res[mid] < targetNumber && res[mid + 1] > targetNumber) {
      return res[mid + 1];
    }
    return findItem(res.slice(mid + 1, res.length - 1), targetNumber);
  }
}

// packages/runtime-core/src/apiLifeCycle.ts
var ApiLifeCycle = /* @__PURE__ */ ((ApiLifeCycle2) => {
  ApiLifeCycle2["BEFORE_MOUNT"] = "bm";
  ApiLifeCycle2["MOUNTED"] = "m";
  ApiLifeCycle2["BEFORE_UPDATE"] = "bu";
  ApiLifeCycle2["UPDATED"] = "u";
  ApiLifeCycle2["BEFORE_UNMOUNT"] = "bum";
  ApiLifeCycle2["UNMOUNTED"] = "um";
  return ApiLifeCycle2;
})(ApiLifeCycle || {});
function onBeforeMount(fn, instance = getCurrentInstance()) {
  injectLifeCycle("bm" /* BEFORE_MOUNT */, fn, instance);
}
function onMounted(fn, instance = getCurrentInstance()) {
  injectLifeCycle("m" /* MOUNTED */, fn, instance);
}
function onBeforeUpdate(fn, instance = getCurrentInstance()) {
  injectLifeCycle("bu" /* BEFORE_UPDATE */, fn, instance);
}
function onUpdated(fn, instance = getCurrentInstance()) {
  injectLifeCycle("u" /* UPDATED */, fn, instance);
}
function onBeforeUnmount(fn, instance = getCurrentInstance()) {
  injectLifeCycle("bum" /* BEFORE_UNMOUNT */, fn, instance);
}
function onUnmounted(fn, instance = getCurrentInstance()) {
  injectLifeCycle("um" /* UNMOUNTED */, fn, instance);
}
function injectLifeCycle(type, cb, instance) {
  if (!instance[type]) {
    instance[type] = [];
  }
  instance[type].push(cb);
}
function triggerLifeCycle(instance, type) {
  if (instance[type]) {
    setCurrentInstance(instance);
    instance[type].forEach((fn) => fn());
    unsetCurrentInstance();
  }
}

// packages/runtime-core/src/renderTemplateRef.ts
function setRef(ref2, vnode) {
  if (!ref2) {
    return;
  }
  const { r: rawRef, i: parntInstance } = ref2;
  const { shapeFlag, props } = vnode;
  if (vnode == null) {
    if (isString(rawRef)) {
      parntInstance.refs[rawRef] = null;
    } else if (isRef(rawRef)) {
      rawRef.value = null;
    }
    return;
  }
  if (isRef(rawRef)) {
    if (shapeFlag & 6 /* COMPONENT */) {
      rawRef.value = getComponentPublicInstance(vnode.component);
    } else {
      rawRef.value = vnode.el;
    }
  } else if (isString(rawRef)) {
    if (shapeFlag & 6 /* COMPONENT */) {
      parntInstance.refs[rawRef] = getComponentPublicInstance(vnode.component);
    }
  }
}

// packages/runtime-core/src/useTemplateRef.ts
function useTemplateRef(refName) {
  const templateRef = ref();
  const vm = getCurrentInstance();
  if (vm) {
    Object.defineProperty(vm.refs, refName, {
      get() {
        return templateRef.value;
      },
      set(value) {
        templateRef.value = value;
      }
    });
  }
  return templateRef;
}

// packages/runtime-core/src/apiInject.ts
function provide(key, value) {
  const vm = getCurrentInstance();
  vm.provides[key] = value;
}
function inject(key, defaultValue) {
  const vm = getCurrentInstance();
  const parentProvide = vm.parent.provides;
  if (parentProvide[key]) {
    return parentProvide[key];
  } else {
    return defaultValue;
  }
}

// packages/runtime-core/src/components/Transtion.ts
var Transition = {
  name: "Transition",
  props: ["name"],
  setup(props, { slots, emit: emit2 }) {
    const vm = getCurrentInstance();
    const enterClass = `${props.name}-enter-from`;
    const enterActiveClass = `${props.name}-enter-active`;
    const leaveClass = `${props.name}-leave-to`;
    const leaveActiveClass = `${props.name}-leave-active`;
    return () => {
      const vnode = slots.default();
      if (vnode) {
        vnode.transition = {
          /**
           * 插入前
           */
          beforeEnter(el) {
            el.classList.add(enterActiveClass);
            el.classList.add(enterClass);
            emit2("beforeEnter", el);
          },
          /**
           * 插入后
           */
          enter(el) {
            requestAnimationFrame(() => {
              el.classList.remove(enterClass);
            });
            const done = () => {
              el.classList.remove(enterActiveClass);
            };
            el.addEventListener(
              "transitionend",
              () => {
                emit2("enter", el, done);
              },
              { once: true }
            );
            emit2("enter", el);
          },
          /**
           * 移除前
           */
          beforeLeave(el, remove) {
            el.classList.add(leaveActiveClass);
            el.classList.add(leaveClass);
            el.addEventListener(
              "transitionend",
              () => {
                remove();
                el.classList.remove(leaveActiveClass);
                el.classList.remove(leaveClass);
              },
              { once: true }
            );
            emit2("beforeLeave", el);
          },
          /**
           * 移除后
           */
          leave(el) {
            el.classList.add(leaveActiveClass);
            el.classList.add(leaveClass);
            emit2("beforeLeave", el);
          }
        };
      }
      return vnode;
    };
  }
};

// packages/runtime-dom/src/index.ts
var renderOptions = {
  patchProp,
  ...nodeOps
};
var renderer = createRenderer(renderOptions);
function render(vnode, container) {
  renderer.render(vnode, container);
}
function createApp(rootComponent, rootProps) {
  const app = renderer.createApp(rootComponent, rootProps);
  const _mount = app.mount;
  app.mount = (selector) => {
    let el = selector;
    if (isString(selector)) {
      el = document.querySelector(selector);
    }
    _mount.call(app, el);
  };
  return app;
}
export {
  ApiLifeCycle,
  Dep,
  KeepAlive,
  ReactiveFlags,
  ReactivityEffect,
  RefImpl,
  Teleport,
  Text,
  Transition,
  activeSub,
  computed,
  createApp,
  createAppAPI,
  createComponentInstance,
  createRenderer,
  createSchedulerFn,
  createVNode,
  effect,
  endTrack,
  getComponentPublicInstance,
  getCurrentInstance,
  getRenderingInstance,
  goCollect,
  goTrigger,
  h,
  initSlots,
  inject,
  isKeepAlive,
  isReactive,
  isRef,
  isTeleport,
  mutableHandlers,
  nextTick,
  normalizeVNode,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  onUnmounted,
  onUpdated,
  provide,
  proxyRefs,
  reactive,
  ref,
  render,
  renderOptions,
  setActiveSub,
  setCurrentInstance,
  setFullProps,
  setRef,
  setRenderingInstance,
  setupComponent,
  toRef,
  toRefs,
  triggerLifeCycle,
  unRef,
  unsetCurrentInstance,
  useTemplateRef,
  watch
};
//# sourceMappingURL=vue.esm.js.map
