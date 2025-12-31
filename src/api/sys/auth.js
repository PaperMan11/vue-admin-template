import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/api/sys/auth/login',
    method: 'post',
    data
  })
}

export function getInfo() {
  return request({
    url: '/api/sys/user/user/info',
    method: 'get'
  })
}

export function logout() {
  return request({
    url: '/api/sys/auth/logout',
    method: 'post'
  })
}

export function register(data) {
  return request({
    url: '/api/sys/auth/register',
    method: 'post',
    data
  })
}

export function refreshToken(data) {
  return request({
    url: '/api/sys/auth/refresh_token',
    method: 'post',
    data
  })
}

export function getCaptcha() {
  return request({
    url: '/api/sys/auth/captcha',
    method: 'get'
  })
}
