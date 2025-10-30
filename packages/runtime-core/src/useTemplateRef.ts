import { getCurrentInstance } from './component'
import { ref } from '@vue/reactivity'

export function useTemplateRef(refName) {
  const templateRef = ref()
  const vm = getCurrentInstance()

  if (vm) {
    Object.defineProperty(vm.refs, refName, {
      get() {
        return templateRef.value
      },
      set(value) {
        templateRef.value = value
      },
    })
  }

  return templateRef
}
