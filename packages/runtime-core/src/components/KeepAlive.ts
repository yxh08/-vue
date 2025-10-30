import { getCurrentInstance } from '@vue/runtime-core'
import { ShapeFlags } from '@vue/shared'

export function isKeepAlive(vnode) {
  return vnode.type.__isKeepAlive
}

export const KeepAlive = {
  props: ['max', 'includes', 'excludes'],
  name: 'KeepAlive',
  __isKeepAlive: true,
  setup(props, { slots }) {
    const cache = new LRU(props.max || Infinity)
    const vm = getCurrentInstance()
    const { createElement, insert, unmount } = vm.ctx.renderer.options

    //拦截组件卸载
    vm.ctx.deactivate = vnode => {
      const dv = createElement('div')
      insert(vnode.el, dv)
      vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE
    }

    //拦截组件挂载
    vm.ctx.activate = (vnode, container, anchor) => {
      if (vnode) {
        insert(vnode.el, container, anchor)
      }
    }

    return () => {
      let vnode = slots.default()
      const key = vnode.key != null ? vnode.key : vnode.type

      if (cache.get(key)) {
        const cachedVNode = cache.get(key)
        //复用缓存起来的组件实例 和 el
        vnode.component = cachedVNode.component
        vnode.el = cachedVNode.el
        //标记 该组件已经被缓存 , 不需要重新挂载
        vnode.shapeFlag = cachedVNode.shapeFlag
        return vnode
      }
      /**
       * 根据props 判断 当前的vnode 是否需要缓存
       */
      if (true) {
        //标记 该组件需要被缓存,不需要卸载
        vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
        const key = vnode.key != null ? vnode.key : vnode.type
        const shouldUnmountVNode = cache.set(key, vnode)
        if (shouldUnmountVNode) {
          shouldUnmountVNode.shapeFlag &= ~ShapeFlags.COMPONENT_KEPT_ALIVE
          shouldUnmountVNode.shapeFlag &=
            ~ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
          unmount(shouldUnmountVNode)
        }
      }
      return vnode
    }
  },
}

class LRU {
  max: number
  store = new Map()
  constructor(max = Infinity) {
    this.max = max
  }

  get(key) {
    return this.store.get(key)
  }

  set(key, vnode) {
    let shouldUnmountVNode
    /**
     * 设置的时候三种情况:
     * 1.store中没有 key
     *  1.1 如果超过max 把最老的踢出去再设置
     *  1.2 没超过 直接设置
     * 2.store 中存在 key , 把存在的删了 , 再设置(更新位置)
     *
     */
    const existingVNode = this.get(key)
    if (existingVNode) {
      //store 中已经缓存,更新位置(把旧的删了,重新插入)
      this.deleteOldest()
    } else {
      if (this.store.size >= this.max) {
        // 如果缓存的数量已经满了,把最老的删了
        shouldUnmountVNode = this.deleteOldest()
      }
    }
    this.store.set(key, vnode)
    return shouldUnmountVNode
  }

  deleteOldest() {
    const { value: key } = this.store.keys().next()
    const vnode = this.get(key)
    this.store.delete(key)
    return vnode
  }
}
