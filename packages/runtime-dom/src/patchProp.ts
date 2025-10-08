import { patchAttr } from './module/patchAttr'
import { patchStyle } from './module/patchStyle'
import { patchClass } from './module/patchClass'
import { patchEvent } from './module/Event'
import { isEvent } from '@vue/shared'

export function patchProp(el, key, preValue, nextValue) {
  //style
  if (key == 'style') {
    return patchStyle(el, preValue, nextValue)
  }

  //class
  if (key == 'class') {
    return patchClass(el, preValue, nextValue)
  }

  //event
  if (isEvent(key)) {
    return patchEvent(el, key, preValue, nextValue)
  }
  //attr
  return patchAttr(el, key, preValue, nextValue)
}
