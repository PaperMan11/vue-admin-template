import Layout from '@/layout'

const systemManagementRouter = {
  path: '/sys',
  component: Layout,
  redirect: 'noRedirect',
  name: 'System',
  alwaysShow: true,
  meta: {
    title: '系统管理',
    icon: 'user'
  },
  children: [
    {
      path: 'user',
      component: () => import('@/views/sys/user/index'),
      name: 'User',
      meta: { title: '用户管理' }
    },
    {
      path: 'role',
      component: () => import('@/views/sys/role/index'),
      name: 'Role',
      meta: { title: '角色管理' }
    }
  ]
}

export default systemManagementRouter
