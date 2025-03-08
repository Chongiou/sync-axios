export interface TransformRequest {
  (this: RequestConfig, data: any, headers: Headers): any
}
export interface TransformResponse {
  (this: RequestConfig, data: any, headers: Headers, status: number): any
}
export interface RequestConfig {
  url?: string
  baseURL?: string
  method?: string
  headers?: Headers
  data?: any
  timeout?: number
  transformRequest?: TransformRequest | TransformRequest[]
  transformResponse?: TransformResponse | TransformResponse[]
}

export interface Response<T = any> {
  status: number
  statusText: string
  headers: Headers
  data: T
  config: RequestConfig
  request: null
}

export type CommonRequestHeadersList = 'Accept' | 'Content-Length' | 'User-Agent' | 'Content-Encoding' | 'Authorization'
export type ContentType = 'text/html' | 'text/plain' | 'multipart/form-data' | 'application/json' | 'application/x-www-form-urlencoded' | 'application/octet-stream'

export type Method = 'get' | 'post'
export type Scope = 'common' | Method
export type Headers = Expand<Partial<{
  [key: string]: any
  'content-type': ContentType
} & {
  [key in CommonRequestHeadersList]?: string | string[] | number | boolean | null
}>>

export type RequestDefaults = Expand<Omit<RequestConfig, 'headers'> & {
  headers: Partial<{ [scope in Scope]: Headers } & {
    [scope: string]: Headers
  }>
}>

export interface OnFulfilledInterceptors<T> {
  (val: T): T
}
export interface OnRejectedInterceptors {
  (err: any): any
}

export type Result<T = unknown, E = unknown> = Ok<T> | Err<E>

export class Ok<T> {
  readonly ok = true
  constructor(public val: T) { }
}

export class Err<E> {
  readonly ok = false
  constructor(public val: E) { }
}


export type Expand<T> = T extends Function
  ? T
  : T extends object
  ? T extends infer O
  ? { [K in keyof O]: Expand<O[K]> }
  : never
  : T
