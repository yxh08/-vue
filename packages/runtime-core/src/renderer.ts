import { ShapeFlags, isSameVNodeType } from '@vue/shared'

export function createRenderer(options) {
  // 提供虚拟节点渲染到页面上的功能
  const {
    createElement: hostCreateElement,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    createText: hostCreateText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,
  } = options

  //挂载子节点
  const mountChildren = (children, el) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      //递归挂载子节点
      patch(null, child, el)
    }
  }

  //卸载子元素
  const unmountChildren = children => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      unmount(child)
    }
  }
  //卸载
  const unmount = vnode => {
    const { type, shapeFlag, children } = vnode

    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //子节点是数组
      unmountChildren(children)
    }
    hostRemove(vnode.el)
  }

  const mountElement = (vnode, container, anchor = null) => {
    const { type, props, children, shapeFlag } = vnode
    const el = hostCreateElement(type)
    vnode.el = el

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //子节点是文本
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      console.log('子节点是数组')
      //子节点是数组
      mountChildren(children, el)
    }

    hostInsert(el, container, anchor)
  }

  const patchProps = (el, oldProps, newProps) => {
    if (oldProps) {
      for (const key in oldProps) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }

    if (newProps) {
      for (const key in newProps) {
        hostPatchProp(el, key, oldProps?.[key], newProps[key])
      }
    }
  }

  const patchKeyedChildren = (c1, c2, el) => {
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    let i = 0
    //头部对比
    while (i <= e1 && i <= e2) {
      if (isSameVNodeType(c1[i], c2[i])) {
        //如果 tagname 和key 都相同，就进行更新
        patchElement(c1[i], c2[i])
      } else {
        //否则退出头部对比
        break
      }
      i++
    }

    //尾部对比
    while (i <= e1 && i <= e2) {
      if (isSameVNodeType(c1[e1], c2[e2])) {
        patchElement(c1[e1], c2[e2])
      } else {
        break
      }
      e1--
      e2--
    }

    console.log(i, e1, e2)

    if (i > e2) {
      // 新的少  老的多 将多出来的老的卸载
      while (i <= e1) {
        unmount(c1[e1])
        e1--
      }
    } else if (i > e1) {
      // 新的多 老的少 挂载新的
      while (i <= e2) {
        console.log('anchor', c2[e2 + 1])
        console.log('new', c2[e2])
        patch(null, c2[e2], el, c2[e2 + 1].el)
        e2--
      }
    } else {
      /**
       * 乱序diff
       *  1.先按照key相同的进行patch
       *   1.1 更新key相同的元素
       *   1.2 卸载key不相同的元素
       *  2.按照新的顺序进行挂载排序
       *
       */
      const keymap = new Map()
      for (let s = i; s <= e2; s++) {
        const { key } = c2[s]
        keymap.set(key, s)
      }
      for (let s = i; s <= e1; s++) {
        const { key } = c1[s]
        if (keymap.has(key)) {
          patch(c1[s], c2[keymap.get(key)])
        } else {
          unmount(c1[s])
        }
      }
      //遍历新的 进行倒序 挂载 排序插入

      for (let s = e2; s >= i; s--) {
        const anchor = c2[s + 1]?.el || null
        if (c2[s].el) {
          hostInsert(c2[s].el, el, anchor)
        } else {
          patch(null, c2[s], el, anchor)
        }
      }
    }
  }

  const patchChildren = (n1, n2, el) => {
    /**
     *  新的子节点是字符串
     *    1.老的是数组
     *    2.老的也是字符串
     *  新的子节点是数组
     *    3.老的是字符串
     *    4.老的也是数组
     *    5.老的是null
     *   新的子节点是null
     *
     */

    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //新的是文本
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        //老的是数组,全部卸载掉
        unmountChildren(n1.children)
      }
      if (n1.children !== n2.children) {
        hostSetElementText(el, n2.children)
      }
    } else {
      //新的是数组
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        //老的是文本
        //删除老的文本节点
        hostSetElementText(el, '')
        //新节点是组数 - 挂载
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(n2.children, el)
        }
        //新节点为null  不处理
      } else {
        if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            //新的是数组，老的也是数组。全量diff
            patchKeyedChildren(n1.children, n2.children, el)
          } else {
            unmountChildren(n1.children)
          }
        } else {
          //老的是null
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            //新的是数组
            mountChildren(n2.children, el)
          }
        }
      }
    }
  }

  const patchElement = (n1, n2) => {
    /**
     * 1.复用dom元素
     * 2.更新props
     * 3.更新children
     */
    const el = (n2.el = n1.el) // 这里更新n2的el ,是为了在 insertBefore 的时候可以根据拿到el ,在这个el前面插入元素

    const oldProps = n1.props
    const newProps = n2.props
    patchProps(el, oldProps, newProps)

    //更新children
    patchChildren(n1, n2, el)
  }

  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) return

    if (n1 && !isSameVNodeType(n1, n2)) {
      // 如果n1 n2 类型或key不相同
      unmount(n1)
      n1 = null
    }
    if (n1 == null) {
      //挂载
      mountElement(n2, container, anchor)
    } else {
      //更新
      patchElement(n1, n2)
    }
  }

  const render = (vnode, container) => {
    /**
     * 1.挂载
     * 2.更新
     * 3.卸载
     */

    if (vnode == null) {
      if (container._vnode) {
        //卸载
        unmount(container._vnode)
      }
    } else {
      //挂载和更新
      patch(container._vnode || null, vnode, container)
    }

    // 保存这次的vnode , 在下次更新的时候能拿到这次的vnode 作为"上一个vnode"
    container._vnode = vnode
  }

  return {
    render,
  }
}
