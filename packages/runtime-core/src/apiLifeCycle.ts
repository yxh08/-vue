import {
  getCurrentInstance,
  setCurrentInstance,
  unsetCurrentInstance,
} from './component'

export enum ApiLifeCycle {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
}

export function onBeforeMount(fn, instance = getCurrentInstance()) {
  injectLifeCycle(ApiLifeCycle.BEFORE_MOUNT, fn, instance)
}

export function onMounted(fn, instance = getCurrentInstance()) {
  injectLifeCycle(ApiLifeCycle.MOUNTED, fn, instance)
}

export function onBeforeUpdate(fn, instance = getCurrentInstance()) {
  injectLifeCycle(ApiLifeCycle.BEFORE_UPDATE, fn, instance)
}

export function onUpdated(fn, instance = getCurrentInstance()) {
  injectLifeCycle(ApiLifeCycle.UPDATED, fn, instance)
}

export function onBeforeUnmount(fn, instance = getCurrentInstance()) {
  injectLifeCycle(ApiLifeCycle.BEFORE_UNMOUNT, fn, instance)
}

export function onUnmounted(fn, instance = getCurrentInstance()) {
  injectLifeCycle(ApiLifeCycle.UNMOUNTED, fn, instance)
}

function injectLifeCycle(type, cb, instance) {
  if (!instance[type]) {
    instance[type] = []
  }
  instance[type].push(cb)
}

export function triggerLifeCycle(instance, type) {
  if (instance[type]) {
    setCurrentInstance(instance)
    instance[type].forEach(fn => fn())
    unsetCurrentInstance()
  }
}
