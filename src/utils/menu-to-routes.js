// 1. 定义静态映射表（后端返回的component值 → 前端组件懒加载函数）
const componentMap = {
  'charts/line': () => import('@/views/charts/line'),
  'charts/mix-chart': () => import('@/views/charts/mix-chart'),
  'components-demo/back-to-top': () => import('@/views/components-demo/back-to-top'),
  'nested/menu1/index': () => import('@/views/nested/menu1/index'),
  'nested/menu1/menu1-1': () => import('@/views/nested/menu1/menu1-1/index.vue'),
  'nested/menu1/menu1-2': () => import('@/views/nested/menu1/menu1-2/index.vue'),
  'nested/menu1/menu1-2/menu1-2-1': () => import('@/views/nested/menu1/menu1-2/menu1-2-1'),
  'nested/menu1/menu1-2/menu1-2-2': () => import('@/views/nested/menu1/menu1-2/menu1-2-2'),
  'nested/menu1/menu1-3': () => import('@/views/nested/menu1/menu1-3'),
  'nested/menu2/index': () => import('@/views/nested/menu2/index'),
  'table/dynamic-table/index': () => import('@/views/table/dynamic-table/index'),
  'table/drag-table': () => import('@/views/table/drag-table'),
  'table/inline-edit-table': () => import('@/views/table/inline-edit-table'),
  'form/index': () => import('@/views/form/index'),
  '404': () => import('@/views/404')
}

export function getComponent(componentPath) {
  // 路径规范化（处理首尾斜杠、反斜杠等）
  const normalizedPath = componentPath?.trim().replace(/^\/|\/$/g, '').replace(/\\/g, '/') || '404'
  // 优先匹配映射表，兜底404
  return componentMap[normalizedPath] || (() => {
    console.warn(`未配置组件映射：${componentPath}，使用404兜底`)
    return componentMap['error/404']
  })
}
