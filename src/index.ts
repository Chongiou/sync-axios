import { createSyncFn } from 'synckit'
import { id, mergeObject, isObject, arrayBufferToJSON } from './utils'
import { RequestConfig, Response, OnFulfilledInterceptors, OnRejectedInterceptors, RequestDefaults, Result } from './types'

class Interceptors<T> {
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

export class Request {
  constructor(defaults: RequestConfig = {}) {
    Object.assign(this.defaults, defaults)

    // internalInterceptors
    this.interceptors.request.use(conf => {
      if (!conf.headers) {
        conf.headers = {}
      }
      if (['post'].includes(conf.method ?? '') && !conf.headers?.['content-type'] && isObject(conf.data)) {
        conf.headers['content-type'] = 'application/json; charset=utf-8'
      }
      if (conf.baseURL) {
        conf.url = new URL(conf.url!, conf.baseURL).toString()
      }
      return conf
    })
  }

  private workerFilepath = `${import.meta.dirname}/index.worker.js`

  public defaults: RequestDefaults = {
    headers: {
      common: {
      }
    },
    transformRequest(data, headers) {
      if (headers['content-type']?.includes('application/json')) {
        try { return JSON.stringify(data) } catch { }
      }
      return data
    },
    transformResponse(data, headers) {
      if (headers['content-type'].includes('application/json')) {
        return arrayBufferToJSON(data)
      }
      return data
    }
  }

  private execTransformRequest(conf: RequestConfig) {
    if (Array.isArray(this.defaults.transformRequest)) {
      this.defaults.transformRequest.forEach(it => {
        conf.data = it.call(conf, conf.data, conf.headers!)
      })
    } else {
      conf.data = this.defaults.transformRequest?.call(conf, conf.data, conf.headers ?? {}) ?? conf.data
    }
    return conf
  }

  private execTransformResponse(conf: RequestConfig, response: Response) {
    if (Array.isArray(this.defaults.transformResponse)) {
      this.defaults.transformResponse.forEach(it => {
        it.call(conf, response.data, response.headers!, response.status)
      })
    } else {
      response.data = this.defaults.transformResponse?.call(conf, response.data, response.headers!, response.status) ?? response.data
    }
    return response
  }

  public interceptors = {
    request: new Interceptors<RequestConfig>(new Map),
    response: new Interceptors<Response>(new Map)
  }

  request<T>(config: RequestConfig): Response<T> {
    try {
      config.headers = this.defaults.headers.common
      Object.assign(this.defaults, { headers: {} })

      let conf = mergeObject({}, this.defaults, config) as typeof config & Omit<typeof this.defaults, 'headers'>
      conf = this.execTransformRequest(conf)
      this.interceptors.request.storage.forEach(({ onFulfilled, onRejected }) => {
        try {
          conf = onFulfilled?.(conf) ?? conf
        } catch (err) {
          onRejected?.(err)
        }
      })

      let result = createSyncFn(this.workerFilepath, conf.timeout).call(this, JSON.parse(JSON.stringify(conf))) as Result<Response<any>, Error>
      if (result.ok) {
        let response = result.val
        response.config = conf
        response = this.execTransformResponse(conf, response)
        this.interceptors.response.storage.forEach(({ onFulfilled, onRejected }) => {
          if (response.status < 200 || response.status > 299) {
            onRejected?.(response)
          }
          try {
            response = onFulfilled?.(response) ?? response
          } catch (err) {
            onRejected?.(err)
          }
        })
        return response
      } else {
        throw result.val
      }
    } catch (err) {
      throw err
    }
  }

  get<T>(url: string, config?: RequestConfig) {
    return this.request<T>({ url, method: 'get', ...config })
  }

  post<T>(url: string, data: any, config?: RequestConfig) {
    return this.request<T>({ url, data, method: 'post', ...config })
  }
}
