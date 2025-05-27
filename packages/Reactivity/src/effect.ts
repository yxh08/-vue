export let activeSub: ReactivityEffect;

export  function effect (fn: Function, effectOptions: {}) {
  const e = new ReactivityEffect(fn);
  Object.assign(e, effectOptions);
  e.run();
  const runner = () => e.run()
  runner.effect = e;
  return runner;
};

import type { Link } from './system';

export class ReactivityEffect {
  deps: Link | undefined;
  depsTail: Link | undefined;
  constructor(public fn: Function) {}

  run() {
    const prevActiveSub = activeSub;
    try {
      this.depsTail = undefined
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
}
