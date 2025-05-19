import { activeSub, ReactivityEffect } from './effect';
import { collect, trigger } from './system';
import { SubNode } from './system';
export const ref = (value: any) => {
  return new RefImpl(value);
};
export class RefImpl {
  headSub: SubNode | undefined;
  tailSub: SubNode | undefined;
  constructor(public _value: any) {}
  get value() {
    //收集依赖
    if (activeSub) {
      collect(this, activeSub);
    }
    return this._value;
  }
  set value(newValue) {
    this._value = newValue;
    //触发依赖
    trigger(this);
  }
}
