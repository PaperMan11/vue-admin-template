import request from '@/utils/request'

// 全部角色
export function getAllRoles() {
  return request({
    url: '/api/sys/role/roles',
    method: 'get'
  })
}

// 获取角色列表
export function getRoleList(data) {
  return request({
    url: '/api/sys/role/list',
    method: 'post',
    data
  })
}

// 创建角色
export function createRole(data) {
  return request({
    url: '/api/sys/role',
    method: 'post',
    data
  })
}

// 更新角色
export function updateRole(data) {
  return request({
    url: '/api/sys/role',
    method: 'put',
    data
  })
}

// 启用/禁用角色
export function toggleRoleStatus(data) {
  return request({
    url: '/api/sys/role/status',
    method: 'put',
    data
  })
}

// 删除角色
export function deleteRole(data) {
  return request({
    url: '/api/sys/role',
    method: 'delete',
    data
  })
}

// 批量删除角色
export function batchDeleteRoles(data) {
  return request({
    url: '/api/sys/role/roles',
    method: 'delete',
    data
  })
}

// 添加角色权限
export function addRolePerms(data) {
  return request({
    url: '/api/sys/role/perms',
    method: 'post',
    data
  })
}

// 更新角色权限
export function updateRolePerms(data) {
  return request({
    url: '/api/sys/role/perms',
    method: 'put',
    data
  })
}

// 删除角色权限
export function deleteRolePerms(data) {
  return request({
    url: '/api/sys/role/perms',
    method: 'delete',
    data
  })
}

// 获取角色权限
export function getRolePerms(value) {
  return request({
    url: `/api/sys/role/perms/${value}`,
    method: 'get'
  })
}
