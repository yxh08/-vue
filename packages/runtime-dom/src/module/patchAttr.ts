export function patchAttr(el, prop, prevValue, nextValue) {
  if (!nextValue) {
    return el.removeAttribute(prop)
  }
  el.setAttribute(prop, nextValue)
}
