const createInvoker = nextValue => {
  const Invoker = e => {
    Invoker.value(e)
  }
  Invoker.value = nextValue
  return Invoker
}

const vei = 'vei'

export function patchEvent(el, eventName, prevValue, nextValue) {
  console.log('patchAttr', el, eventName, prevValue, nextValue)
  const rawName = eventName.slice(2).toLowerCase()

  console.log('nextValue', nextValue)
  el[vei] ??= {}

  let Invoker = el[vei][rawName]

  if (Invoker && nextValue) {
    Invoker.value = nextValue
  } else {
    if (nextValue) {
      Invoker = createInvoker(nextValue)
      el[vei][rawName] = Invoker
      el.addEventListener(rawName, Invoker)
    } else {
      el.removeEventListener(rawName, Invoker)
    }
  }
}
