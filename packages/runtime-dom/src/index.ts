import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'
export * from '@vue/runtime-core'
import { createRenderer } from '@vue/runtime-core'

export const renderOptions = {
  patchProp,
  ...nodeOps,
}

const renderer = createRenderer(renderOptions)
export function render(vnode, container) {
  renderer.render(vnode, container)
}
