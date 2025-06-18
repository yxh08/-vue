import { collect, Dependcy, Link, Sub, trigger } from './system'
import { isFunction } from '../../Shared/src'
import { activeSub, endTrack, setActiveSub } from './effect'

export function computed(getterOrOptions) {
  let getter
  let setter
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  return new ComputedImpl(getter, setter)
}

class ComputedImpl implements Dependcy, Sub {
  _value
  // 作为dep
  subs: Link | undefined
  subsTail: Link | undefined
  //作为sub
  deps: Link | undefined
  depsTail: Link | undefined

  tracking = false

  dirty: boolean = true
  constructor(
    public getter,
    private setter,
  ) {}
  get value() {
    if (this.dirty) {
      //true 脏
      this._value = this.update()
      //缓存效果 false 干净
      this.dirty = false
    }

    //自身为dep时,收集sub
    if (activeSub) {
      collect(this, activeSub)
    }
    return this._value
  }

  set value(newValue) {
    console.log('set newValue', newValue)
    if (this.setter) {
      this.setter(newValue, this._value)
      trigger(this)
    } else {
      console.warn('只读对象')
    }
  }
  //单独
  update() {
    // 将自身当做sub时,收集dep
    const prevActiveSub = activeSub
    try {
      if (this.tracking) return
      this.tracking = true
      this.depsTail = undefined
      setActiveSub(this)
      return this.getter()
    } finally {
      this.tracking = false
      setActiveSub(prevActiveSub)
      if (this.depsTail) {
        endTrack(this)
      }
    }
  }
}
