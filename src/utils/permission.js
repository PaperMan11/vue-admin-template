/**
 * 初始化权限列表
 * @param {Array<string>} perms - 用户的权限列表
 * @returns {Object} 包含权限标志的对象
 */
export function initPermissions(perms) {
  const perm = {
    canRead: false,
    canEdit: false,
    canDelete: false,
    canAdd: false
  }
  if (Array.isArray(perms)) {
    perms = perms.map(p => p.toUpperCase())
    if (perms.length > 0) {
      perm.canAdd = true
    }
    // perm.canRead = perms.includes('READ')
    perm.canEdit = perms.includes('UPDATE')
    perm.canDelete = perms.includes('DELETE')
    perm.canAdd = perms.includes('CREATE')
  }
  return perm
}

/**
 * 检查是否拥有指定权限（单个）
 * @param {Array<string>} prems - 用户的权限列表
 * @param {string} perm - 要检查的权限（如 "READ"）
 * @returns {boolean} 是否拥有该权限
 */
export function hasPermission(prems, perm) {
  if (!perm || typeof perm !== 'string') return false
  return prems.includes(perm.toUpperCase())
}

/**
 * 检查是否拥有指定权限（多个，满足其一即可）
 * @param {Array<string>} prems - 用户的权限列表
 * @param {Array<string>} perms - 要检查的权限列表（如 ["READ", "WRITE"]）
 * @returns {boolean} 是否拥有其中任一权限
 */
export function hasAnyPermission(prems, perms) {
  if (!Array.isArray(perms) || perms.length === 0) return false
  const upperPerms = perms.map(p => p.toUpperCase())
  return prems.some(p => upperPerms.includes(p))
}

