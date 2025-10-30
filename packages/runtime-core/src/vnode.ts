/**
 * 创建虚拟节点的底层方法
 * @param type 节点类型
 * @param props 节点的属性
 * @param children 子节点
 */
import {
  isArray,
  isFunction,
  isNumber,
  isObject,
  isString,
  ShapeFlags,
} from '@vue/shared'
import { getRenderingInstance } from './component'
import { isTeleport } from './components/Teleport'

export function normalizeVNode(vnode) {
  if (isString(vnode) || isNumber(vnode)) {
    return createVNode(Text, null, String(vnode))
  }
  return vnode
}
export const Text = Symbol('v-txt')

export function createVNode(type, props, children) {
  let shapeFlag = 0

  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT

    if (isString(children) || isNumber(children)) {
      shapeFlag |= ShapeFlags.TEXT_CHILDREN
    } else if (isArray(children)) {
      shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    }
  } else {
    if (isTeleport(type)) {
      shapeFlag = ShapeFlags.TELEPORT
    } else if (isObject(type)) {
      shapeFlag = ShapeFlags.STATEFUL_COMPONENT
    } else if (isFunction(type)) {
      //函数式组件
      shapeFlag |= ShapeFlags.FUNCTIONAL_COMPONENT
    }
    if (isString(children) || isNumber(children)) {
      shapeFlag |= ShapeFlags.TEXT_CHILDREN
    } else if (isArray(children)) {
      shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    } else if (isObject(children)) {
      shapeFlag |= ShapeFlags.SLOTS_CHILDREN
    } else if (isFunction(children)) {
      shapeFlag |= ShapeFlags.SLOTS_CHILDREN
      children = { default: children }
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
    appContext: null,
  }
  return vnode
}

function normalizeRef(ref) {
  if (!ref) return ref
  return {
    r: ref,
    i: getRenderingInstance(),
  }
}
