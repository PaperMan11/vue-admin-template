import Layout from '@/layout'

const userManagementRouter = {
  path: '/sys/user',
  component: Layout,
  redirect: 'noRedirect',
  name: 'UserManagement',
  children: [
    {
      path: 'user',
      component: () => import('@/views/sys/user/index'),
      name: 'User',
      meta: { title: '用户管理', icon: 'chart', noCache: true }
    }
  ]
}

export default userManagementRouter
