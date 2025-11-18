import Vue from 'vue'
import store from '@/store'
import { isString, isArray } from '@/utils/validate'
import settings from '@/settings'

// 当任何组件发生错误时，errorHandler 会被触发。它会将错误详情（错误对象、组件实例、错误场景、URL）通过 store.dispatch 发送到 Vuex 的 errorLog 模块中保存起来，同时在控制台打印错误。

/*
  1. 组件渲染错误
  模板语法错误、数据不存在、DOM 操作异常等。
  2. 事件处理函数错误
  点击、输入等事件触发的方法中抛出错误。
  3. 生命周期钩子错误
  created、mounted、updated 等钩子中执行错误代码。
  4. 异步操作错误
  setTimeout、Promise、async/await 中未捕获的错误。
  5. 自定义指令错误
  指令的 bind、update 等钩子中出错。
  6. 组件递归错误
  组件无限递归渲染导致栈溢出。
*/

// you can set in settings.js
// errorLog:'production' | ['production', 'development']
const { errorLog: needErrorLog } = settings

function checkNeed() {
  const env = process.env.NODE_ENV
  if (isString(needErrorLog)) {
    return env === needErrorLog
  }
  if (isArray(needErrorLog)) {
    return needErrorLog.includes(env)
  }
  return false
}

if (checkNeed()) {
  Vue.config.errorHandler = function(err, vm, info, a) {
  // Don't ask me why I use Vue.nextTick, it just a hack.
  // detail see https://forum.vuejs.org/t/dispatch-in-vue-config-errorhandler-has-some-problem/23500
    Vue.nextTick(() => {
      store.dispatch('errorLog/addErrorLog', {
        err,
        vm,
        info,
        url: window.location.href
      })
      console.error('Vue 错误：', err)
      console.log('组件实例：', vm)
      console.log('错误场景：', info)// 如 "render"、"watch"、"event handler"
    })
  }
}
