import { constantRoutes } from '@/router'
// 导入布局组件（通用布局，如侧边栏+主内容）
import Layout from '@/layout/index.vue'
import { getComponent } from '@/utils/menu-to-routes'

/**
 * 生成唯一路由名称（避免重复）
 * @param {string} path 路由路径
 * @returns {string} 路由名称
 */
function generateRouteName(path) {
  if (!path || path === '/') return 'Index'
  // 路径转驼峰：/sys/user → SysUser
  return path
    .split('/')
    .filter(segment => segment)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('')
}

const state = {
  routes: [],
  addRoutes: []
}

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  }
}

const actions = {
  generateRoutes({ commit }, menus) {
    return new Promise(resolve => {
      const routes = []
      // 递归处理菜单（核心）
      const transformMenu = (menu) => {
        // 过滤条件：禁用/隐藏/按钮类型(F) 不生成路由
        if (menu.status !== 1 || menu.hidden || menu.menu_type === 'F') {
          return null
        }

        // 基础路由配置
        const route = {
          path: menu.path,
          // redirect: menu.redirect || (menu.children && menu.children.length > 0 ? menu.children[0].path : 'noRedirect'),
          hidden: menu.hidden,
          meta: { ...menu.meta }, // 透传元数据
          name: generateRouteName(menu.path) // 生成唯一路由名称
        }

        if (menu?.redirect !== '') {
          route.redirect = menu.redirect
        }

        if (menu.component === 'Layout') { // 特殊处理：如果组件字段为 'Layout'，则使用布局组件
          route.component = Layout
        } else {
          // 处理组件路径（懒加载）
          const componentPath = menu.component || '404'
          // route.component = () => import(`@/views/${componentPath}.vue`)
          route.component = getComponent(componentPath)
        }

        // 处理子菜单
        if (menu.children && menu.children.length > 0) {
          const childRoutes = menu.children
            .map(child => transformMenu(child))
            .filter(Boolean) // 过滤null值（禁用/隐藏的子菜单）
            .sort((a, b) => a.meta.sort - b.meta.sort) // 按排序号排序

          if (childRoutes.length > 0) {
            route.children = childRoutes
            // // 目录类型默认重定向到第一个子菜单
            // if (menu.menu_type === 'M' && !route.redirect) {
            //   route.redirect = childRoutes[0].path
            // }
          }
        }

        return route
      }

      // 处理根菜单（parent_id = 0 的菜单）
      menus.filter(menu => menu.parent_id === 0) // 根菜单
        .sort((a, b) => a.sort - b.sort) // 按排序号排序
        .forEach(menu => {
          const route = transformMenu(menu)
          if (route) routes.push(route)
        })

      commit('SET_ROUTES', routes)
      return resolve(routes)
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
