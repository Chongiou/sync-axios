<h1 align="center">sync-axios</h1>

<p align="center">
  Axios API 风格的 http 同步请求(但实现不完整)
</p>

使用 [synckit](https://github.com/un-ts/synckit) 实现同步，因此性能会比 [sync-request](https://github.com/ForbesLindesay/sync-request) 好一些
> 需要避免类似 **主线程在等待 Worker 线程的结果, 而 Worker 线程在等待主线程处理** 的场景，这会造成死锁，导致无限等待。比如使用同步请求于主线程的 http 服务

## 安装
```sh
npm i @chongiou/sync-axios
```

## 用法
```ts
import { Request } from "@chongiou/sync-axios"
const axios = new Request
const res = axios.get('https://echo.apifox.com/get')
console.log(res)
```

[View on npm](https://www.npmjs.com/package/@chongiou/sync-axios)  
[View on gh](https://github.com/chongiou/sync-axios)  
