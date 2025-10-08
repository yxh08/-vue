/**
 * 创建虚拟节点的底层方法
 * @param type 节点类型
 * @param props 节点的属性
 * @param children 子节点
 */
import { isArray, isString, ShapeFlags } from '@vue/shared'

export function createVNode(type, props, children) {
  let shapeFlag = 0

  if (isString(type)) {
    shapeFlag |= ShapeFlags.ELEMENT
  }
  if (isString(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN
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
    shapeFlag,
  }
  return vnode
}
