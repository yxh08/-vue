// packages/reactivity/src/effect.ts
var activeSub;
var effect = (fn) => {
  const e = new ReactivityEffect(fn);
  e.run();
};
var ReactivityEffect = class {
  constructor(fn) {
    this.fn = fn;
  }
  run() {
    const prevActiveSub = activeSub;
    activeSub = this;
    this.fn();
    activeSub = prevActiveSub;
  }
};

// packages/reactivity/src/system.ts
var collect = (refObj) => {
  const newSub = {
    prevSub: void 0,
    sub: activeSub,
    nextSub: void 0
  };
  if (!refObj.headSub) {
    refObj.headSub = newSub;
    refObj.tailSub = newSub;
  } else {
    refObj.tailSub.nextSub = newSub;
    newSub.prevSub = refObj.tailSub;
    refObj.tailSub = newSub;
  }
};
var trigger = (refObj) => {
  if (refObj.headSub) {
    let curSub = refObj.headSub;
    let queue = [];
    while (curSub?.sub) {
      queue.push(curSub.sub);
      curSub = curSub.nextSub;
    }
    console.log("\u5F85\u6267\u884C\u961F\u5217", queue);
    for (let i = 0; i <= queue.length - 1; i++) {
      queue[i].run();
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
      collect(this);
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
