import { collect, Dependcy, Link, Sub, trigger } from './system'
import { hasChanged, isFunction } from '@vue/shared/src/utils'
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
      this.update()
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

    const oldValue = this._value
    const prevActiveSub = activeSub
    try {
      if (this.tracking) return
      this.tracking = true
      this.depsTail = undefined
      setActiveSub(this)
      this._value = this.getter()
      /**
       * 每次执行完update后,将_value标记为干净值,
       * 只有依赖的dep被set后,通过链表节点找到这个computed重新获取新值 前!
       * 才会标记为脏值.这时再次get value才会重新执行update,否则get value 都是获取的缓存数据,不会真正执行computed中的回调
       */
      this.dirty = false
      return hasChanged(this._value, oldValue) ? true : false
    } finally {
      this.tracking = false
      setActiveSub(prevActiveSub)
      if (this.depsTail) {
        endTrack(this)
      }
    }
  }
}
