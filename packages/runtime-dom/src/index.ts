import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'
export * from '@vue/runtime-core'
import { createRenderer } from '@vue/runtime-core'
import { isString } from '@vue/shared'

export const renderOptions = {
  patchProp,
  ...nodeOps,
}

const renderer = createRenderer(renderOptions)
export function render(vnode, container) {
  renderer.render(vnode, container)
}

export function createApp(rootComponent, rootProps) {
  const app = renderer.createApp(rootComponent, rootProps)
  const _mount = app.mount
  app.mount = selector => {
    let el = selector
    if (isString(selector)) {
      el = document.querySelector(selector)
    }
    _mount.call(app, el)
  }

  return app
}
