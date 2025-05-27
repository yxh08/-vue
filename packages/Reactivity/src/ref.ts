import { activeSub, ReactivityEffect } from './effect';
import { collect, trigger } from './system';
import { Link } from './system';
export const ref = (value: any) => {
  return new RefImpl(value);
};
export class RefImpl {
  subs: Link | undefined;
  subsTail: Link | undefined;
  constructor(public _value: any) {}
  get value() {
    //收集依赖
    // console.log('收集依赖',activeSub)
    if (activeSub) {
      collect(this, activeSub);
    }
    return this._value;
  }
  set value(newValue) {
    this._value = newValue;
    //触发依赖
    // console.log('触发依赖')
    trigger(this);
  }
}
