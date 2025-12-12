import request from '@/utils/request'

// 用户列表
export function getUserList(data) {
  return request({
    url: '/api/sys/user/list',
    method: 'post',
    data
  })
}

// 新增用户
export function createUser(data) {
  return request({
    url: '/api/sys/user',
    method: 'post',
    data
  })
}

// 编辑用户
export function updateUser(data) {
  return request({
    url: '/api/sys/user',
    method: 'put',
    data
  })
}

// 删除用户
export function deleteUser(data) {
  return request({
    url: '/api/sys/user',
    method: 'delete',
    data
  })
}

// 切换用户状态
export function toggleUserStatus(data) {
  return request({
    url: '/api/sys/user/status',
    method: 'put',
    data
  })
}

// 分配角色
export function assignUserRole(data) {
  return request({
    url: '/api/sys/user/assign-role',
    method: 'post',
    data
  })
}

// 管理员重置用户密码
export function updatePassword(data) {
  return request({
    url: '/api/sys/user/password',
    method: 'put',
    data
  })
}

// 修改自身密码
export function updateUserPassword(data) {
  return request({
    url: '/api/sys/user/user/password',
    method: 'put',
    data
  })
}

// 根据ID获取用户
export function getUserById(id) {
  return request({
    url: `/api/sys/user/${id}`,
    method: 'get'
  })
}

// 获取当前用户信息
export function getUserInfo() {
  return request({
    url: '/api/sys/user/user/info',
    method: 'get'
  })
}
