/**
 *  h函数的使用方法
 *   -两个参数的情况
 *   1.h('div','hello world) 第二个参数为 字符串类型的子节点
 *   2.h('div',[h('span','hello'),h('span','world')]) 第二个参数为 数组类型的子节点
 *   3.h('div',h('span','hello world'))第二个参数为 对象类型 & vnode类型 的子节点
 *   4.h('div',{class:'container'}) 第二个参数为 对象类型 的props
 *  ----
 *   -两个以上参数的情况
 *   5.h('div',{class:'container'},'hello world') 第三个参数为 string类型的 子节点
 *   6.h('div',{class:'container'},h('span','hello world')) 第三个参数为 object & vnode 类型的子节点
 *   7.h('div',{class:'container'},[h('span','hello'),h('span',' world')])  第三个参数为 array类型的子节点
 *   8.h('div',{class:'container'},h('span','hello'),h('span',' world')) 大于三个参数,看成 7 这样处理
 */

import { isArray, isObject, isVNode } from '@vue/shared'
import { createVNode } from './vnode'

export function h(type, propsOrChildren?, children?) {
  /**
   * h函数 主要作用是对 createVNode 的参数作一个标准化
   */
  let l = arguments.length

  if (l === 2) {
    if (isArray(propsOrChildren)) {
      // 类型 2: h('div',  [h('span','hello'),h('span','world')]
      return createVNode(type, null, propsOrChildren)
    }
    if (isObject(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        //类型 3: h('div',h('span','hello world'))
        return createVNode(type, null, [propsOrChildren])
      } else {
        //类型 4: h('div',{class:'container'})
        return createVNode(type, propsOrChildren)
      }
    }

    // 类型1: h('div','hello world)
    return createVNode(type, null, propsOrChildren)
  } else {
    if (l > 3) {
      // 类型6: h('div',{class:'container'},h('span','hello world'))
      return createVNode(type, propsOrChildren, [...arguments.slice(2)])
    } else {
      if (isVNode(children)) {
        return createVNode(type, propsOrChildren, [children])
      }
      return createVNode(type, propsOrChildren, children)
    }
  }
}
