export let activeSub

export const effect = fn => {
  const e = new ReactivityEffect(fn)
  e.run()
}

class ReactivityEffect {
  constructor(public fn) {}

  run() {
    const prevActiveSub = activeSub
    activeSub = this
    this.fn()
    activeSub = prevActiveSub
  }
}
