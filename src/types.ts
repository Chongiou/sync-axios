interface TransformRequest {
  (this: RequestConfig, data: any, headers: Record<string, any>): any
}
interface TransformResponse {
  (this: RequestConfig, data: any, headers: Record<string, any>, status: number): any
}
export interface RequestConfig {
  url?: string
  baseURL?: string
  method?: string
  headers?: Record<string, any>
  data?: any
  timeout?: number
  transformRequest?: TransformRequest | TransformRequest[]
  transformResponse?: TransformResponse | TransformResponse[]
}

export interface Response<T = any> {
  status: number
  statusText: string
  headers: Record<string, string | string[]>
  data: T
  config: RequestConfig
  request: null
}

export type CommonRequestHeadersList = 'Accept' | 'Content-Length' | 'User-Agent' | 'Content-Encoding' | 'Authorization'
export type ContentType = 'text/html' | 'text/plain' | 'multipart/form-data' | 'application/json' | 'application/x-www-form-urlencoded' | 'application/octet-stream'

export type RequestDefaults = Omit<RequestConfig, 'headers'> & {
  headers: {
    common: Partial<{
      [key in CommonRequestHeadersList]: string | string[] | number | boolean | null
    } & {
      'content-type': ContentType
    }>
  }
}

export interface OnFulfilledInterceptors<T> {
  (val: T): T
}
export interface OnRejectedInterceptors {
  (err: any): any
}
