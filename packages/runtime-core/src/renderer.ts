import { ShapeFlags, isSameVNodeType, normalizeProps } from '@vue/shared'
import { createAppAPI } from './apiCreateApp'
import {
  createComponentInstance,
  createSchedulerFn,
  h,
  initSlots,
  isKeepAlive,
  isRef,
  isTeleport,
  normalizeVNode,
  proxyRefs,
  ReactivityEffect,
  setFullProps,
  setRef,
  setRenderingInstance,
  setupComponent,
  Text,
  triggerLifeCycle,
} from './index'
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
  const mountChildren = (children, el, parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      const child = (children[i] = normalizeVNode(children[i]))
      //递归挂载子节点
      patch(null, child, el, null, parentComponent)
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
    const { type, shapeFlag, children, ref, component } = vnode

    if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
      //拦截keepAlive 的子组件的卸载
      //调用keepalive 组件上的方法,将该组件的dom缓存起来 , 不进行卸载
      component.parent.ctx.deactivate(vnode)
      return
    }

    //处理组件卸载 前 的生命周期
    if (shapeFlag & ShapeFlags.COMPONENT) {
      const instance = vnode.component
      triggerLifeCycle(instance, 'bum')
    }

    if (shapeFlag & ShapeFlags.COMPONENT) {
      //组件卸载的逻辑
      unmount(vnode.component.subTree)
    } else if (isTeleport(vnode.type)) {
      unmountChildren(children)
      return
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //子节点是数组
      unmountChildren(children)
    }
    if (ref != null) {
      setRef(ref, vnode)
    }

    /**
     * 移除节点之前调用 transition beforeLeave
     */
    if (vnode.transition) {
      const remove = () => hostRemove(vnode.el)
      vnode.transition?.beforeLeave(vnode.el, remove)
    } else {
      hostRemove(vnode.el)
    }

    /**
     * 移除节点之前调用 transition beforeLeave
     */
    // if (vnode.transition) {
    //   vnode.transition?.leave(vnode.el)
    // }

    //处理组件卸载 后 的生命周期
    if (shapeFlag & ShapeFlags.COMPONENT) {
      const instance = vnode.component
      triggerLifeCycle(instance, 'um')
    }
  }

  const mountElement = (vnode, container, anchor = null, parentComponent) => {
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
      //子节点是数组
      mountChildren(children, el, parentComponent)
    }

    /**
     * 插入之前 调用 transition 的 beforeEnter
     */
    if (vnode.transition) {
      vnode.transition?.beforeEnter(vnode.el)
    }
    hostInsert(el, container, anchor)

    /**
     * 插入之之后 调用 transition 的 Enter
     */
    if (vnode.transition) {
      vnode.transition?.enter(vnode.el)
    }
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
  //新老都是数组进行乱序diff 的时候 ,获取最长递增子序列
  const patchKeyedChildren = (c1, c2, el, parentComponent) => {
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    let i = 0
    //头部对比
    while (i <= e1 && i <= e2) {
      if (isSameVNodeType(c1[i], c2[i])) {
        //如果 tagname 和key 都相同，就进行更新
        patch(c1[i], c2[i], el, null, parentComponent)
        // patchElement(c1[i], c2[i])
      } else {
        //否则退出头部对比
        break
      }
      i++
    }

    //尾部对比
    while (i <= e1 && i <= e2) {
      if (isSameVNodeType(c1[e1], c2[e2])) {
        patch(c1[e1], c2[e2], el, null, parentComponent)
      } else {
        break
      }
      e1--
      e2--
    }

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
        patch(null, c2[e2], el, c2[e2 + 1].el, parentComponent)
        e2--
      }
    } else {
      /**
       * 乱序diff
       *  1.先按照key相同的进行patch
       *   1.1 更新key相同的元素
       *   1.2 卸载key不相同的元素
       *  2.按照新的顺序进行挂载排序
       */

      const keymap = new Map()
      for (let s = i; s <= e2; s++) {
        const { key } = c2[s]
        if (key) {
          keymap.set(key, s)
        }
      }
      console.log('keymap', keymap)
      /**
       *  循环老的数组
       *  1.更新keymap中存在的项, 不存在就卸载
       *  2.将该项的index推入 newToOldIndex中,用来求最长递增子序列
       */
      let newToOldIndex = []
      let moved = false
      let startIndex = -1
      for (let s = i; s <= e1; s++) {
        const { key } = c1[s]
        if (keymap.has(key) && isSameVNodeType(c1[s], c2[keymap.get(key)])) {
          patch(c1[s], c2[keymap.get(key)], el, null, parentComponent)
          newToOldIndex.push(keymap.get(key))
          if (keymap.get(key) < startIndex) {
            moved = true
          }
          startIndex = keymap.get(key)
        } else {
          unmount(c1[s])
        }
      }

      const res = getLongestArr(newToOldIndex)
      //遍历新的 进行倒序 挂载 排序插入
      for (let s = e2; s >= i; s--) {
        const anchor = c2[s + 1]?.el || null
        if (c2[s].el && moved) {
          if (!res.includes(s)) continue
          hostInsert(c2[s].el, el, anchor)
        } else {
          patch(null, c2[s], el, anchor, parentComponent)
        }
      }
    }
  }

  const patchChildren = (n1, n2, el, parentComponent) => {
    /**
     *  新的子节点是字符串
     *    1.老的是数组
     *    2.老的也是字符串
     *  新的子节点是数组
     *    3.老的是字符串
     *    4.老的也是数组
     *    5.老的是null
     *   新的子节点是null
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
          mountChildren(n2.children, el, parentComponent)
        }
        //新节点为null  不处理
      } else {
        if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            //新的是数组，老的也是数组。全量diff

            for (let key in n2.children) {
              //将数组中可能出现的文本节点标准化为vnode
              n2.children[key] = normalizeVNode(n2.children[key])
            }

            patchKeyedChildren(n1.children, n2.children, el, parentComponent)
          } else {
            unmountChildren(n1.children)
          }
        } else {
          //老的是null
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            //新的是数组
            mountChildren(n2.children, el, parentComponent)
          }
        }
      }
    }
  }

  const patchElement = (n1, n2, parentComponent) => {
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
    patchChildren(n1, n2, el, parentComponent)
  }

  //处理文本节点
  function processText(n1, n2, container, anchor) {
    if (n1 == null) {
      //挂载
      const el = hostCreateText(n2.children) //创建文本节点
      n2.el = el //保存文本节点到vnode
      hostInsert(el, container, anchor)
    } else {
      //更新
      n2.el = n1.el //复用文本节点
      if (n1.children !== n2.children) {
        hostSetText(n2.el, n2.children)
      }
    }
  }

  //处理元素节点
  function processElement(n1, n2, container, anchor, parentComponent) {
    if (n1 == null) {
      //挂载
      mountElement(n2, container, anchor, parentComponent)
    } else {
      //更新
      patchElement(n1, n2, parentComponent)
    }
  }

  function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode
    instance.next = null
    setFullProps(nextVNode, instance, instance.props, instance.attrs)
    initSlots(instance)
  }

  function shouldUpdateComponent(n1, n2) {
    /**
     * 需要更新的情况:
     * 前后的 children 发生改变
     * 前后的 props 发生改变
     */
    const { props: prevProps, children: prevChildren } = n1
    const { props: nextProps, children: nextChildren } = n2

    //任意一个有插槽就需要更新
    if (prevChildren || nextChildren) {
      return true
    }

    // 之前没有, 是否更新取决于新的
    if (!prevProps) {
      return !!nextProps
    }

    //之前有,之后没有 需要更新
    if (prevProps && !nextProps) {
      return true
    }

    //前后都有props 数量不一样s
    const nextKeys = Object.keys(nextProps)

    if (nextKeys.length !== Object.keys(prevProps).length) {
      //前后两次数量不一样
      return true
    }
    for (const key of nextKeys) {
      if (nextProps[key] !== prevProps[key]) {
        // 任意一个值发生改变 需要更新
        return true
      }
    }
    //否则不需要更新
    return false
  }

  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component)
    /**
     * n1 和 n2 都是stateful Component 的vnode
     * n1 已经被实例化过,instance上有 el和 vnode
     * n2 需要复用n1的instance 和 el,并且更新props 和 slots ,这样就不用实例化了
     */

    if (shouldUpdateComponent(n1, n2)) {
      /**
       *  将n2 放到instance上面 ,执行instance.update时 处理需要更新的props
       */
      instance.next = n2
      instance.update()
    } else {
      console.log('n1,n2 ===>', n1, n2)
      n2.el = n1.el
      instance.vnode = n2
    }
  }

  /**
   * processComponent 将状态组件处理成 vnode 再次交给patch
   * @param n1 旧的状态组件
   * @param n2 新的状态组件
   * @param container 挂载容器
   * @param anchor
   */

  function processComponent(n1, n2, container, anchor, parentComponent) {
    if (n1 === null) {
      //挂载组件

      const { shapeFlag } = n2
      if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        n2.component.parent.ctx.activate(n2, container, anchor)
        return
      }

      const instance = createComponentInstance(n2, parentComponent, {
        ...options,
        unmount,
      })
      // 将组件的实例保存到虚拟节点上，方便后续复用
      n2.component = instance

      const schedulerFn = createSchedulerFn(instance, function (instance) {
        if (!instance.isMounted) {
          //第一次挂载组件
          /**
           * onBeforeMount
           */
          triggerLifeCycle(instance, 'bm')

          setRenderingInstance(instance)
          const subTree = instance!.render.call(instance.proxy)
          setRenderingInstance(null)

          patch(null, subTree, container, anchor, instance)

          //subTree被patch后,其自身上的el为n2复用
          n2.el = subTree?.el
          instance.isMounted = true
          instance.subTree = subTree
          /**
           * onMounted
           */
          triggerLifeCycle(instance, 'm')
        } else {
          let { next, vnode } = instance
          /**
           * onBeforeUpdate
           */
          triggerLifeCycle(instance, 'bu')
          if (next) {
            //更新props
            updateComponentPreRender(instance, next)
          } else {
            next = vnode
          }
          //依赖的响应式数据改变,render重新执行
          const prevSubTree = instance.subTree
          setRenderingInstance(instance)
          const subTree = instance!.render.call(instance.proxy)

          console.log('subTree ===>', subTree)
          setRenderingInstance(null)
          patch(prevSubTree, subTree, container, anchor, instance)
          // subTree 有可能是null 或 undefined  (不进行渲染)
          next.el = subTree?.el
          instance.subTree = subTree
          /**
           * onUpdated
           */
          triggerLifeCycle(instance, 'u')
        }
      })
      const effect = new ReactivityEffect(schedulerFn)
      instance.update = effect.run.bind(effect)
      effect.scheduler = () => Promise.resolve().then(instance.update)
      effect.run()
    } else {
      //更新组件
      updateComponent(n1, n2)
      // const instance = (n2.component = n1.component)
      // const prevSubTree = n1.component.subTree
      // instance.props = n2.props
      // console.log('n1,n2 ===>', n1, n2)
      // setupComponent(instance)
      // const subTree = instance.render.call(instance.proxy)
      // patch(prevSubTree, subTree, container, anchor)
      // n2.component.subTree = subTree
    }
  }

  const patch = (n1, n2, container, anchor = null, parentComponent) => {
    if (n1 === n2) return

    if (n1 && !isSameVNodeType(n1, n2)) {
      // 如果n1 n2 类型或key不相同
      anchor = hostNextSibling(n1.el)
      unmount(n1)
      n1 = null
    }

    //如果n2 是null 或者undefined的话就不渲染了
    if (!n2) return

    const { type, shapeFlag, ref } = n2
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          //普通元素节点 div p h1 span 等
          processElement(n1, n2, container, anchor, parentComponent)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor, parentComponent)
        } else if (shapeFlag & ShapeFlags.TELEPORT) {
          type.process(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            mountChildren,
            patchChildren,
            options,
          )
        }
    }
    setRef(ref, n2)
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
      patch(container._vnode || null, vnode, container, null)
    }
    // 保存这次的vnode , 在下次更新的时候能拿到这次的vnode 作为"上一个vnode"
    container._vnode = vnode
  }

  return {
    render,
    createApp: createAppAPI(render),
  }
}

function getLongestArr(list) {
  const res = []
  let itemPrevMap: Record<string, number> = {}
  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    if (res.length == 0) {
      res.push(item)
    } else if (item > res[res.length - 1]) {
      itemPrevMap[item] = res[res.length - 1]
      res.push(item)
    } else {
      //遇到比res中最后一个数小,二分查找,找到数组中只比i大的最小的数,并替换它
      const target = findItem(res, item)
      const targetIndex = res.findIndex(x => x == target)
      res.splice(targetIndex, 1, item)
      if (targetIndex - 1 >= 0) {
        itemPrevMap[item] = res[targetIndex - 1]
      }
    }
  }

  let result = []
  let current = res[res.length - 1]
  result.push(current)
  while (itemPrevMap[current]) {
    result.push(itemPrevMap[current])
    current = itemPrevMap[current]
  }
  return result.reverse()
}

//二分查找
function findItem(res, targetNumber) {
  let mid = Math.floor(res.length / 2)
  if (res[0] > targetNumber) {
    return res[0]
  } else if (res[mid] < targetNumber && res[mid + 1] > targetNumber) {
    return res[mid + 1]
  } else if (res[mid] > targetNumber) {
    if (res[mid] > targetNumber && res[mid - 1] < targetNumber) {
      return res[mid]
    } else {
      return findItem(res.slice(0, mid + 1), targetNumber)
    }
  } else {
    if (res[mid] < targetNumber && res[mid + 1] > targetNumber) {
      return res[mid + 1]
    }
    return findItem(res.slice(mid + 1, res.length - 1), targetNumber)
  }
}
