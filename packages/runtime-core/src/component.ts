import { proxyRefs, reactive, toRefs } from '@vue/reactivity'
import {
  hasOwn,
  isArray,
  isFunction,
  isObject,
  normalizeProps,
  ShapeFlags,
} from '@vue/shared'
import { nextTick } from './scheduler'
import { isKeepAlive } from './components/KeepAlive'

const publicPropertiesMap = {
  $attrs: instance => instance.attrs,
  $refs: instance => instance.refs,
  $props: instance => instance.props,
  $slots: instance => instance.slots,
  $emit: instance => emit.bind(null, instance),
  $nextTick: instance => nextTick.bind(instance),
  $el: instance => instance.vnode.el,
}
export function createComponentInstance(vnode, parent, options) {
  const appContext = parent ? parent.appContext : vnode.appContext
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
    provides: Object.create(parent ? parent.provides : appContext.provides),
  }

  instance.ctx = { _: instance }

  //处理props
  setFullProps(vnode, instance, instance.props, instance.attrs)
  //处理slots
  initSlots(instance)

  //如果是keepAlive组件,要把options 放到instance.ctx上面
  if (isKeepAlive(vnode)) {
    instance.ctx.renderer = { options: { ...options } }
  }

  //处理状态
  setupComponent(instance)
  //
  instance.proxy = new Proxy(instance.ctx, componentProxyGetter)
  return instance
}

export function initSlots(instance) {
  const { vnode } = instance

  const { shapeFlag, children } = vnode
  if (shapeFlag & ShapeFlags.SLOTS_CHILDREN && isObject(children)) {
    //将这次 vnode 上的slots 更新到instance 上
    for (const slotName in children) {
      instance.slots[slotName] = children[slotName]
    }

    //删除instance 存在这次没有的slot
    for (const slotName in instance.slots) {
      if (!children[slotName]) {
        delete instance.slots[slotName]
      }
    }
  }
}

export function setupComponent(instance) {
  /**
   * 1. 没有setup的情况
   * 2. setup返回函数 视作render函数处理
   * 3. setup返回对象 视作状态对象(setupState)处理
   */
  const { type } = instance

  const { shapeFlag } = instance.vnode
  if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    //状态组件
    if (isFunction(type.setup)) {
      const setupContext = createSetupContext(instance)
      instance.setupContext = setupContext

      setCurrentInstance(instance)
      const setupResult = type.setup(instance.props, setupContext)
      unsetCurrentInstance()
      if (isFunction(setupResult)) {
        //setup函数返回一个函数
        instance.render = setupResult
      } else if (isObject(setupResult)) {
        //setup函数返回一个对象
        instance.setupState = proxyRefs(setupResult || {})
        instance.render = type.render
      } else {
      }
    } else {
      instance.render = type.render
    }
  } else {
    //函数式组件
    instance.render = () =>
      type(instance.props, {
        attrs: instance.attrs,
        emit(event, ...args) {
          emit(instance, event, ...args)
        },
        slots: instance.slots,
      })
  }
}

const createSetupContext = instance => {
  return {
    get attrs() {
      return instance.attrs
    },
    emit(event, ...args) {
      emit(instance, event, ...args)
    },
    slots: instance.slots,
    expose(exposed) {
      instance.exposed = exposed
    },
  }
}

function emit(instance, event, ...args) {
  const rawProps = instance.vnode.props
  const eventName = `on${event[0].toUpperCase() + event.slice(1)}`
  if (rawProps[eventName]) {
    rawProps[eventName](...args)
  }
}

export function getComponentPublicInstance(instance) {
  /**
   * 如果实例上有exposed 返回 exposed + publicPropertiesMap
   * 否则返回 instance.proxy
   */
  if (instance.exposed) {
    return (instance.exposeProxy ??= new Proxy(instance.exposed, {
      get(target, key) {
        if (key in target) {
          return target[key]
        }
        if (key in publicPropertiesMap) {
          return publicPropertiesMap[key](instance)
        }
      },
    }))
  } else {
    return instance.proxy
  }
}

/**
 *  设置组件的props
 *  ```md
 *  状态组件:
 *  1.有声明的props 放到props 剩余放到attrs里面
 *  2.没有定义接收的props 全放到attrs 中
 *  函数组件:
 *  1.有声明的props 放到props 剩余放到attrs里面
 *  2.没声明props 都放到props里面
 *
 *  ** 定义了props 都是一样的逻辑 **
 *  ** 函数式组件没定义props的话 全放到props里 **
 *  ** 状态组件没定义props的话  全放到attrs里 **
 *  ```
 */
export function setFullProps(vnode, instance, props, attrs) {
  const { shapeFlag } = vnode
  //获取传入的props
  const rawProps = vnode.props

  if (vnode.type.props && Object.keys(vnode.type.props).length) {
    const definedProps = normalizeProps(vnode.type.props)
    for (let key in rawProps) {
      if (Object.hasOwn(definedProps, key)) {
        props[key] = rawProps[key]
      } else {
        attrs[key] = rawProps[key]
      }
    }
  } else {
    if (shapeFlag & ShapeFlags.FUNCTIONAL_COMPONENT) {
      for (let key in rawProps) {
        props[key] = rawProps[key]
      }
    } else {
      for (let key in rawProps) {
        attrs[key] = rawProps[key]
      }
    }
  }

  instance.props = props
  instance.attrs = attrs
}

function normalizeProps(props) {
  if (isArray(props)) {
    // props:['a','b','c'] =>  { a:{},b:{},c:{}}
    return props.reduce((objProps, cur) => {
      objProps[cur] = {}
      return objProps
    }, {})
  } else {
    return props
  }
}

const componentProxyGetter = {
  get(_target, key, receiver) {
    const target = _target._
    console.log('target, key, receiver ===>', target, key, receiver)
    const setupState = target.setupState
    const props = target.props
    if (Object.hasOwn(setupState, key)) {
      return setupState[key]
    } else if (Object.hasOwn(props, key)) {
      return props[key]
    }
    if (Object.hasOwn(publicPropertiesMap, key)) {
      const publicGetter = publicPropertiesMap[key]
      if (isFunction(publicGetter)) {
        return publicPropertiesMap[key](target)
      }
    }

    return target[key]
    // return Reflect.get(target, key, receiver)
  },
  set(target, key, newValue, receiver) {
    const setupState = target.setupState
    const props = target.props
    if (Object.hasOwn(setupState, key)) {
      setupState[key] = newValue
      return true
    } else if (Object.hasOwn(props, key)) {
      console.warn('readOnly props', key)
      return true
      // setupState[key] = newValue
      // return true
    }
    return true
    // return Reflect.set(target, key, newValue, receiver)
  },
}

let currentInstance = null
export function setCurrentInstance(instance) {
  currentInstance = instance
}

export function getCurrentInstance() {
  return currentInstance
}

export function unsetCurrentInstance() {
  currentInstance = null
}

let renderingInstance = null
export function setRenderingInstance(instance) {
  renderingInstance = instance
}
export function getRenderingInstance() {
  return renderingInstance
}
