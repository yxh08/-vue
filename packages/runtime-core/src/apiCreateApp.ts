import { h } from './h'
export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps) {
    const context = {
      //app 往后代组件使用provide 注入的属性
      provides: {},
    }

    const app = {
      _container: null,
      mount(container) {
        const vnode = h(rootComponent, rootProps)
        // 为根组件绑定context
        vnode.appContext = context
        render(vnode, container)
        app._container = container
      },
      unmount() {
        render(null, app._container)
      },
      provide(key, value) {
        context.provides[key] = value
      },
    }
    return app
  }
}
