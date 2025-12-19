import Layout from '@/layout'

const systemManagementRouter = {
  path: '/sys',
  component: Layout,
  redirect: 'noRedirect',
  name: 'System',
  alwaysShow: true,
  meta: {
    title: '系统管理',
    icon: 'user',
    meta: {
      perms: ['CREATE', 'DELETE', 'UPDATE', 'READ']
    }
  },
  children: [
    {
      path: 'user',
      component: () => import('@/views/sys/user/index'),
      name: 'User',
      meta: { title: '用户管理', perms: ['CREATE', 'DELETE', 'UPDATE', 'READ'] }
    },
    {
      path: 'role',
      component: () => import('@/views/sys/role/index'),
      name: 'Role',
      meta: { title: '角色管理', perms: ['CREATE', 'DELETE', 'UPDATE', 'READ'] }
    },
    {
      path: 'scope',
      component: () => import('@/views/sys/scope/index'),
      name: 'Scope',
      meta: { title: '安全范围管理', perms: ['CREATE', 'DELETE', 'UPDATE', 'READ'] }
    }
  ]
}

export default systemManagementRouter
