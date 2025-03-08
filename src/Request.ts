import { createSyncFn } from 'synckit'
import { mergeObject, isObject, arrayBufferToJSON, arrayBufferToText } from './utils'
import { RequestConfig, Response, RequestDefaults, Result } from './types'
import { Interceptors } from './Interceptors'
import { URLSearchParams } from 'node:url'

export class Request {
  constructor(defaults: RequestConfig = {}) {
    this.defaults.headers.common = defaults.headers ?? {}
    Object.assign(this.defaults, Object.assign({}, defaults, { headers: {} }))

    function internalInterceptorsForMergeConfig(this: Request, userConfig: RequestConfig) {
      // 合并配置, 优先级: 实例配置 < 请求配置
      const headers = Object.assign({}, this.defaults.headers.common, (this.defaults.headers as any)?.[userConfig.method!] ?? {}, userConfig.headers)
      const defaults = Object.assign({}, this.defaults, { headers }) as RequestConfig
      const configResolve = mergeObject({}, defaults, userConfig) as RequestConfig

      if (configResolve.baseURL) {
        configResolve.url = new URL(configResolve.url!, configResolve.baseURL).toString()
      }
      return configResolve
    }

    this.interceptors.request.use(internalInterceptorsForMergeConfig.bind(this))
  }

  private workerFilepath = `${import.meta.dirname}/index.worker.js`

  public defaults: RequestDefaults = {
    headers: {
      common: {},
      post: {},
      get: {},
    },
    transformRequest: [
      (data, headers) => {
        if (!headers['content-type']) {
          if (isObject(data)) {
            headers['content-type'] = 'application/json'
            return JSON.stringify(data)
          }
          if (typeof data === 'string' || data instanceof URLSearchParams) {
            headers['content-type'] = 'application/x-www-form-urlencoded'
            return data.toString()
          }
        }
        return data
      }
    ],
    transformResponse: [
      (data, headers) => {
        if (headers['content-type']?.includes('application/json')) {
          data = arrayBufferToJSON(data)
        }
        if (headers['content-type']?.includes('text/html') || headers['content-type']?.includes('text/plain')) {
          data = arrayBufferToText(data)
        }
        return data
      }
    ]
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

  private execTransformResponse(response: Response) {
    const conf = response.config
    if (this.defaults.transformResponse) {
      const transformResponseArray = Array.isArray(this.defaults.transformResponse) ? this.defaults.transformResponse : [this.defaults.transformResponse]
      transformResponseArray.forEach(it => {
        response.data = it.call(conf, response.data, response.headers!, response.status)
      })
    }
    return response
  }

  public interceptors = {
    request: new Interceptors<RequestConfig>(new Map),
    response: new Interceptors<Response>(new Map)
  }

  private execRequestInterceptors(conf: RequestConfig) {
    this.interceptors.request.storage.forEach(({ onFulfilled, onRejected }) => {
      try {
        conf = onFulfilled?.(conf) ?? conf
      } catch (err) {
        if (onRejected) {
          onRejected(err)
        } else {
          throw err
        }
      }
    })
    return conf
  }

  private execResponseInterceptors(response: Response) {
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
  }

  request<T>(config: RequestConfig): Response<T> {
    try {
      config = this.execRequestInterceptors(config)
      config = this.execTransformRequest(config)

      let result = createSyncFn(this.workerFilepath, config.timeout).call(this, JSON.parse(JSON.stringify(config))) as Result<Response<any>, Error>

      if (result.ok) {
        let response = result.val
        response.config = config
        response = this.execTransformResponse(response)
        response = this.execResponseInterceptors(response)
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
