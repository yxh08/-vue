export function patchStyle(el, prevValue, nextValue) {
  if (nextValue) {
    for (const styleName in nextValue) {
      el.style[styleName] = nextValue[styleName]
    }
  }

  if (prevValue) {
    for (const key in prevValue) {
      if (nextValue?.[key] == null) {
        el.style[key] = null
      }
    }
  }
}
