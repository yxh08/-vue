import { isString, ShapeFlags } from '@vue/shared'
import { isRef } from '@vue/reactivity'
import { getComponentPublicInstance } from './component'

export function setRef(ref, vnode) {
  if (!ref) {
    //vnode 的上的ref ,没有说明不需要挂载 卸载操作
    return
  }

  const { r: rawRef, i: parntInstance } = ref
  const { shapeFlag, props } = vnode

  /**
   * vnode == null 卸载操作
   */
  if (vnode == null) {
    if (isString(rawRef)) {
      parntInstance.refs[rawRef] = null
    } else if (isRef(rawRef)) {
      rawRef.value = null
    }
    return
  }

  /**
   * 挂载ref操作
   */

  if (isRef(rawRef)) {
    if (shapeFlag & ShapeFlags.COMPONENT) {
      rawRef.value = getComponentPublicInstance(vnode.component)
    } else {
      rawRef.value = vnode.el
    }
  } else if (isString(rawRef)) {
    if (shapeFlag & ShapeFlags.COMPONENT) {
      parntInstance.refs[rawRef] = getComponentPublicInstance(vnode.component)
    }
  }
}
