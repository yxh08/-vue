export function isTeleport(type) {
  return type.__isTeleport
}
export const Teleport = {
  name: 'Teleport',
  __isTeleport: true,
  props: {},
  process(
    n1,
    n2,
    container,
    anchor,
    parentComponent,
    mountChildren,
    patchChildren,
    options,
  ) {
    const { querySelector, insert } = options
    const { disabled, to } = n2.props
    const target = disabled ? container : querySelector(to)
    if (n1 == null) {
      //挂载
      if (target) {
        mountChildren(n2.children, target, parentComponent)
        n2.target = target
      }
    } else {
      /**
       * 更新的逻辑
       * 1.先不管位置是否发生改变,先把旧位置的节点全部更新
       * 2.然后根据target是否发生变化,将旧位置的节点移动到新位置
       */
      patchChildren(n1, n2, n1.target, parentComponent)
      if (n1.target !== target) {
        console.log('n1 ===>', n1)
        for (const vnode of n1.children) {
          insert(vnode.el, target, null)
        }
      }
      n2.target = target
    }
  },
}
