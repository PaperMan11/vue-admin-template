import request from '@/utils/request'

// 全部安全范围
export function getAllScopes() {
  return request({
    url: '/api/sys/scope/all',
    method: 'get'
  })
}

// 安全范围列表
export function getScopeList(data) {
  return request({
    url: '/api/sys/scope/list',
    method: 'post',
    data
  })
}

// 根据ID获取安全范围
export function getScopeById(id) {
  return request({
    url: `/api/sys/scope/${id}`,
    method: 'get'
  })
}

// 创建安全范围
export function createScope(data) {
  return request({
    url: '/api/sys/scope',
    method: 'post',
    data
  })
}

// 更新安全范围
export function updateScope(data) {
  return request({
    url: '/api/sys/scope',
    method: 'put',
    data
  })
}

// 删除安全范围
export function deleteScope(data) {
  return request({
    url: '/api/sys/scope',
    method: 'delete',
    data
  })
}

// 添加安全范围菜单
export function addScopeMenus(data) {
  return request({
    url: '/api/sys/scope/menus',
    method: 'post',
    data
  })
}

// 删除安全范围菜单
export function deleteScopeMenus(data) {
  return request({
    url: '/api/sys/scope/menus',
    method: 'delete',
    data
  })
}

// 获取安全范围菜单
export function getScopeMenus(id) {
  return request({
    url: `/api/sys/scope/menus/${id}`,
    method: 'get'
  })
}

// 菜单树形结构
export function getMenuTree(data) {
  return request({
    url: '/api/sys/scope/menu/tree',
    method: 'post',
    data
  })
}

// 根据ID获取菜单
export function getMenuById(id) {
  return request({
    url: `/api/sys/scope/menu/${id}`,
    method: 'get'
  })
}

// 创建菜单
export function createMenu(data) {
  return request({
    url: '/api/sys/scope/menu',
    method: 'post',
    data
  })
}

// 更新菜单
export function updateMenu(data) {
  return request({
    url: '/api/sys/scope/menu',
    method: 'put',
    data
  })
}

// 删除菜单
export function deleteMenu(data) {
  return request({
    url: '/api/sys/scope/menu',
    method: 'delete',
    data
  })
}
