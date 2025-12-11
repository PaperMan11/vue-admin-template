import axios from 'axios'
import { MessageBox, Message } from 'element-ui'
import store from '@/store'
import { getToken, getRefreshToken, setToken, setRefreshToken, removeRefreshToken, getUid } from '@/utils/auth'

// create an axios instance
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 5000 // request timeout
})

// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent

    if (store.getters.token) {
      // let each request carry token
      // ['X-Token'] is a custom headers key
      // please modify it according to the actual situation
      // config.headers['X-Token'] = getToken()
      config.headers['Authorization'] = `Bearer ${getToken()}`
    }
    return config
  },
  error => {
    // do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

// 标记是否正在刷新token（避免并发请求重复刷新）
let isRefreshing = false
// 存储等待重试的请求队列
let requestsQueue = []

const AUTH_ERROR_CODES = {
  TOKEN_ILLEGAL: 100005, // 非法token
  TOKEN_EXPIRED: 100003, // access_token过期
  REFRESH_TOKEN_EXPIRED: 100011 // 刷新令牌过期
}

// 弹窗确认重新登录
export function confirmReLogin() {
  MessageBox.confirm(
    '你的登录状态已失效，可以取消留在当前页面，或重新登录',
    '确认登出',
    {
      confirmButtonText: '重新登录',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async() => {
    // 重置token
    await store.dispatch('user/resetToken')
    location.reload()
    // 跳转到登录页（替代刷新页面，体验更优）
    // const redirect = encodeURIComponent(window.location.href)
    // window.location.href = `/login?redirect=${redirect}`
  }).catch(() => {
    // 取消登录时的兜底（如清空敏感数据）
    store.dispatch('user/resetToken')
  })
}

function refreshTokenLogic(originalRequest) {
  // 若正在刷新token，将请求加入队列等待
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      requestsQueue.push({ resolve, reject, config: originalRequest })
    })
  }
  // 开始刷新token
  isRefreshing = true
  const refreshToken = getRefreshToken()
  if (refreshToken) {
    removeRefreshToken() // 防止多次刷新时使用同一个refresh token
    return new Promise((resolve, reject) => {
      service.post('/api/sys/auth/refresh_token', { refresh_token: refreshToken, uid: parseInt(getUid(), 10) })
        .then(data => {
          if (data.code === 0) {
            const { access_token, refresh_token } = data.data
            // 更新存储的token
            setToken(access_token)
            setRefreshToken(refresh_token)
            // 重试原请求
            resolve(service(originalRequest))
            // 处理等待队列中的请求
            requestsQueue.forEach(({ resolve: rqResolve, config }) => {
              config.headers['Authorization'] = `Bearer ${access_token}`
              rqResolve(service(config))
            })
            requestsQueue = []
          } else {
            // 刷新失败，触发重新登录流程
            requestsQueue.forEach(({ reject: rqReject }) => {
              rqReject(new Error('你的登录状态已失效'))
            })
            reject(new Error('你的登录状态已失效'))
          }
        })
        .catch(err => {
          // 刷新请求出错，触发重新登录流程
          requestsQueue.forEach(({ reject: rqReject }) => {
            rqReject(err)
          })
          reject(err)
        })
        .finally(() => {
          isRefreshing = false
        })
    })
  }
  return Promise.reject(new Error('你的登录状态已失效'))
}

// response interceptor
service.interceptors.response.use(
  /**
   * 如需获取响应头/状态码等 HTTP 信息，直接 return response 即可
   */
  response => {
    const res = response.data
    const SUCCESS_CODE = 0
    if (res.code === SUCCESS_CODE) {
      return res
    }
    // 仅处理access_token过期的场景（优先刷新）
    if (res.code === AUTH_ERROR_CODES.TOKEN_EXPIRED) {
      // 封装原请求的重试逻辑
      const originalRequest = response.config
      return refreshTokenLogic(originalRequest)
    }
    // 处理认证失效场景
    if (
      res.code === AUTH_ERROR_CODES.TOKEN_ILLEGAL ||
      res.code === AUTH_ERROR_CODES.TOKEN_EXPIRED ||
      res.code === AUTH_ERROR_CODES.REFRESH_TOKEN_EXPIRED
    ) {
      // 弹窗确认重新登录
      // confirmReLogin()
      // 抛出业务异常，供接口调用处捕获
      return Promise.reject(new Error('你的登录状态已失效'))
    } else {
      // 抛出业务异常，供接口调用处捕获
      return Promise.reject(new Error(res?.msg || '业务请求失败'))
    }
  },
  error => {
    // 处理HTTP层面的错误（如404/500/网络错误）
    // console.log('HTTP请求错误：', error) // 调试用

    // 解析HTTP错误中的业务信息
    if (error.response) {
      const { status, data } = error.response
      // 适配401未授权（后端直接返回HTTP状态码的场景）
      if (status === 401) {
        return refreshTokenLogic(error.response.config)
      } else {
        // 其他HTTP状态码的错误信息
        const errorMsg = data?.msg || `请求失败（${status})`
        // 统一提示HTTP错误
        Message({
          message: errorMsg,
          type: 'error',
          duration: 5 * 1000
        })
      }
    }
    return Promise.reject(error)
  }
)

export default service
