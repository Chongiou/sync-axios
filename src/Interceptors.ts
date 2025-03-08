import { OnFulfilledInterceptors, OnRejectedInterceptors } from "./types"
import { id } from "./utils"

export class Interceptors<T> {
  constructor(public storage: Map<string, {
    onFulfilled?: OnFulfilledInterceptors<T>,
    onRejected?: OnRejectedInterceptors
  }>) {
  }
  use(onFulfilled?: OnFulfilledInterceptors<T>, onRejected?: OnRejectedInterceptors) {
    if (!onFulfilled && !onRejected) {
      return
    }
    const useId = id()
    this.storage.set(useId, { onFulfilled, onRejected })
    return useId
  }
  eject(id: string) {
    return this.storage.delete(id)
  }
  clear() {
    return this.storage.clear
  }
}
