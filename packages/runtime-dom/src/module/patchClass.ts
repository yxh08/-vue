export function patchClass(el, prevValue, nextValue) {
  if (nextValue == undefined) {
    //移除class
    el.removeAttribute('class')
  } else {
    el.className = nextValue
  }
}
