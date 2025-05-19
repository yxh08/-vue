export let activeSub: ReactivityEffect;

export const effect = (fn: Function) => {
  const e = new ReactivityEffect(fn);
  e.run();
};

import type { DepNode } from './system';

export class ReactivityEffect {
  headDep: DepNode | undefined;
  constructor(public fn: Function) {}

  run() {
    const prevActiveSub = activeSub;
    activeSub = this;
    this.fn();
    activeSub = prevActiveSub;
  }
}
