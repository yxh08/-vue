import { isObject } from '../../Shared/src/index'
import { mutableHandlers } from './baseHandlers'

export function reactive(target: any) {
  return createReactiveObject(target)
}

const proxyMap = new WeakMap() //存放响应式对象的proxy
const proxySet = new WeakSet() //已经通过代理得到proxy 而再次代理,通过weakSet检查是target是否是是一个proxy.
function createReactiveObject(target) {
  if (!isObject(target)) {
    console.warn(target, '不是对象类型')
    return target
  }

  // target already has corresponding Proxy
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  //target is a proxy
  const isReactiveProxy = proxySet.has(target)
  if (isReactiveProxy) {
    console.log('reactiveProxy', target)
    return target
  }

  const proxy = new Proxy(target, mutableHandlers)
  proxyMap.set(target, proxy)
  proxySet.add(proxy)
  return proxy
}
