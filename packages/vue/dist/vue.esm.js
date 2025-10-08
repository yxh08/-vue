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
    return el.removeAttribute(prop);
  }
  el.setAttribute(prop, nextValue);
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
  console.log("patchAttr", el, eventName, prevValue, nextValue);
  const rawName = eventName.slice(2).toLowerCase();
  console.log("nextValue", nextValue);
  el[vei] ??= {};
  let Invoker = el[vei][rawName];
  if (Invoker && nextValue) {
    Invoker.value = nextValue;
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
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
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
      if ("update" in curSub.sub) {
        curSub.sub.dirty = true;
        processComputedUpdate(curSub.sub);
      } else {
        queue.push(curSub.sub);
      }
      curSub = curSub.nextSub;
    }
    console.log("\u5F85\u6267\u884C\u961F\u5217", queue);
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

// packages/reactivity/src/baseHandlers.ts
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

// packages/reactivity/src/reactive.ts
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

// packages/reactivity/src/ref.ts
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
function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}
function toRefs(object) {
  const keys = Object.keys(object);
  console.log(keys);
}
function proxyRefs(target) {
  return new Proxy(target, {
    get(target2, key, receiver) {
    },
    set(target2, key, newValue, receiver) {
    }
  });
}
var _a2;
_a2 = "__v_isRef" /* IS_REF */;
var ObjectRefImpl = class {
  constructor(_object, _key) {
    this._object = _object;
    this._key = _key;
    this[_a2] = true;
  }
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
  const mountChildren = (children, el) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      patch(null, child, el);
    }
  };
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      unmount(child);
    }
  };
  const unmount = (vnode) => {
    const { type, shapeFlag, children } = vnode;
    if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      unmountChildren(children);
    }
    hostRemove(vnode.el);
  };
  const mountElement = (vnode, container, anchor = null) => {
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
      console.log("\u5B50\u8282\u70B9\u662F\u6570\u7EC4");
      mountChildren(children, el);
    }
    hostInsert(el, container, anchor);
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
  const patchKeyedChildren = (c1, c2, el) => {
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    let i = 0;
    while (i <= e1 && i <= e2) {
      if (isSameVNodeType(c1[i], c2[i])) {
        patchElement(c1[i], c2[i]);
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      if (isSameVNodeType(c1[e1], c2[e2])) {
        patchElement(c1[e1], c2[e2]);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    console.log(i, e1, e2);
    if (i > e2) {
      while (i <= e1) {
        unmount(c1[e1]);
        e1--;
      }
    } else if (i > e1) {
      while (i <= e2) {
        console.log("anchor", c2[e2 + 1]);
        console.log("new", c2[e2]);
        patch(null, c2[e2], el, c2[e2 + 1].el);
        e2--;
      }
    } else {
      const keymap = /* @__PURE__ */ new Map();
      for (let s = i; s <= e2; s++) {
        const { key } = c2[s];
        keymap.set(key, s);
      }
      for (let s = i; s <= e1; s++) {
        const { key } = c1[s];
        if (keymap.has(key)) {
          patch(c1[s], c2[keymap.get(key)]);
        } else {
          unmount(c1[s]);
        }
      }
      for (let s = e2; s >= i; s--) {
        const anchor = c2[s + 1]?.el || null;
        if (c2[s].el) {
          hostInsert(c2[s].el, el, anchor);
        } else {
          patch(null, c2[s], el, anchor);
        }
      }
    }
  };
  const patchChildren = (n1, n2, el) => {
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
          mountChildren(n2.children, el);
        }
      } else {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            patchKeyedChildren(n1.children, n2.children, el);
          } else {
            unmountChildren(n1.children);
          }
        } else {
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(n2.children, el);
          }
        }
      }
    }
  };
  const patchElement = (n1, n2) => {
    const el = n2.el = n1.el;
    const oldProps = n1.props;
    const newProps = n2.props;
    patchProps(el, oldProps, newProps);
    patchChildren(n1, n2, el);
  };
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) return;
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1);
      n1 = null;
    }
    if (n1 == null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2);
    }
  };
  const render2 = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };
  return {
    render: render2
  };
}

// packages/runtime-core/src/vnode.ts
function createVNode(type, props, children) {
  let shapeFlag = 0;
  if (isString(type)) {
    shapeFlag |= 1 /* ELEMENT */;
  }
  if (isString(children)) {
    shapeFlag |= 8 /* TEXT_CHILDREN */;
  } else if (isArray(children)) {
    shapeFlag |= 16 /* ARRAY_CHILDREN */;
  }
  const vnode = {
    __is_VNode: true,
    type,
    props,
    children,
    //需要挂载的目标元素
    el: null,
    // 做diff用
    key: props?.key,
    shapeFlag
  };
  return vnode;
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

// packages/runtime-dom/src/index.ts
var renderOptions = {
  patchProp,
  ...nodeOps
};
var renderer = createRenderer(renderOptions);
function render(vnode, container) {
  renderer.render(vnode, container);
}
export {
  Dep,
  ReactiveFlags,
  ReactivityEffect,
  RefImpl,
  activeSub,
  computed,
  createRenderer,
  createVNode,
  effect,
  endTrack,
  goCollect,
  goTrigger,
  h,
  isRef,
  mutableHandlers,
  proxyRefs,
  reactive,
  ref,
  render,
  renderOptions,
  setActiveSub,
  toRef,
  toRefs
};
//# sourceMappingURL=vue.esm.js.map
