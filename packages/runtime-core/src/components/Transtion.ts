import { getCurrentInstance, h } from '@vue/runtime-core'

export const Transition = {
  name: 'Transition',
  props: ['name'],
  setup(props, { slots, emit }) {
    const vm = getCurrentInstance()
    //进入class动画
    const enterClass = `${props.name}-enter-from`
    const enterActiveClass = `${props.name}-enter-active`

    //离开class动画
    const leaveClass = `${props.name}-leave-to`
    const leaveActiveClass = `${props.name}-leave-active`

    return () => {
      const vnode = slots.default()
      if (vnode) {
        vnode.transition = {
          /**
           * 插入前
           */
          beforeEnter(el) {
            el.classList.add(enterActiveClass)
            el.classList.add(enterClass)

            // 执行用户传入的回调
            emit('beforeEnter', el)
          },
          /**
           * 插入后
           */
          enter(el) {
            requestAnimationFrame(() => {
              el.classList.remove(enterClass)
            })
            const done = () => {
              el.classList.remove(enterActiveClass)
            }

            el.addEventListener(
              'transitionend',
              () => {
                emit('enter', el, done)
              },
              { once: true },
            )

            // 执行用户传入的回调
            emit('enter', el)
          },

          /**
           * 移除前
           */
          beforeLeave(el, remove) {
            el.classList.add(leaveActiveClass)
            el.classList.add(leaveClass)
            el.addEventListener(
              'transitionend',
              () => {
                remove()
                el.classList.remove(leaveActiveClass)
                el.classList.remove(leaveClass)
              },
              { once: true },
            )

            // 执行用户传入的回调
            emit('beforeLeave', el)
          },

          /**
           * 移除后
           */
          leave(el) {
            el.classList.add(leaveActiveClass)
            el.classList.add(leaveClass)
            // 执行用户传入的回调
            emit('beforeLeave', el)
          },
        }
      }
      return vnode
    }
  },
}
