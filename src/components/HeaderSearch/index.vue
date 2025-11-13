<template>
  <div :class="{'show':show}" class="header-search">
    <svg-icon class-name="search-icon" icon-class="search" @click.stop="click" />
    <el-select
      ref="headerSearchSelect"
      v-model="search"
      :remote-method="querySearch"
      filterable
      default-first-option
      remote
      placeholder="Search"
      class="header-search-select"
      @change="change"
    >
      <el-option v-for="{ item } in options" :key="item.path" :value="item" :label="item.title.join(' > ')" />
    </el-select>
  </div>
</template>

<script>
// fuse is a lightweight fuzzy-search module
// make search results more in line with expectations
import Fuse from 'fuse.js'
import path from 'path'

export default {
  name: 'HeaderSearch',
  data() {
    return {
      search: '', // 搜索输入的关键词
      options: [], // 搜索结果列表（供 el-select 展示）
      searchPool: [], // 搜索池（所有可搜索的路由数据）
      show: false, // 控制搜索框显示/隐藏
      fuse: undefined // Fuse 实例（用于模糊搜索）
    }
  },
  computed: {
    // 从 Vuex 中获取用户有权限访问的路由列表
    routes() {
      return this.$store.getters.permission_routes
    }
  },
  watch: {
    // 当权限路由变化时，重新生成搜索池
    routes() {
      this.searchPool = this.generateRoutes(this.routes)
    },
    // 当搜索池变化时，初始化 Fuse 实例（配置搜索规则）
    searchPool(list) {
      this.initFuse(list)
    },
    // 当显示状态变化时，绑定/解绑全局点击事件（用于点击外部关闭搜索框）
    show(value) {
      if (value) {
        document.body.addEventListener('click', this.close)
      } else {
        document.body.removeEventListener('click', this.close)
      }
    }
  },
  mounted() {
    this.searchPool = this.generateRoutes(this.routes)
  },
  methods: {
    click() {
      this.show = !this.show
      if (this.show) {
        // 显示时让搜索框获取焦点
        this.$refs.headerSearchSelect && this.$refs.headerSearchSelect.focus()
      }
    },
    close() {
      this.$refs.headerSearchSelect && this.$refs.headerSearchSelect.blur() // 失去焦点
      this.options = [] // 清空搜索结果
      this.show = false // 隐藏搜索框
    },
    change(val) {
      this.$router.push(val.path) // 跳转到选中路由的路径
      this.search = '' // 清空搜索关键词
      this.options = [] // 清空结果
      this.$nextTick(() => {
        this.show = false // 延迟隐藏搜索框（避免跳转时闪烁）
      })
    },
    initFuse(list) {
      this.fuse = new Fuse(list, {
        shouldSort: true, // 搜索结果排序
        threshold: 0.4, // 匹配阈值（值越小越精确）
        location: 0, // 匹配起始位置权重
        distance: 100, // 匹配距离（字符间距）
        maxPatternLength: 32, // 最大匹配长度
        minMatchCharLength: 1, // 最小匹配字符数
        keys: [ // 搜索的字段及权重（title 权重 0.7，path 权重 0.3）
          { name: 'title', weight: 0.7 },
          { name: 'path', weight: 0.3 }
        ]
      })
    },
    // Filter out the routes that can be displayed in the sidebar
    // And generate the internationalized title
    generateRoutes(routes, basePath = '/', prefixTitle = []) {
      let res = []
      for (const router of routes) {
        // 跳过隐藏的路由（hidden: true）
        if (router.hidden) { continue }

        // 拼接路由路径和标题（支持嵌套路由，如 "系统管理 > 用户列表"）
        const data = {
          path: path.resolve(basePath, router.path), // 解析完整路径（如将 "/system" + "user" 转为 "/system/user"）
          title: [...prefixTitle] // 继承父路由的标题前缀
        }

        // 若路由有 meta.title（显示标题），则添加到搜索池
        if (router.meta && router.meta.title) {
          data.title = [...data.title, router.meta.title] // 拼接当前路由标题
          // 跳过无 redirect 的父路由（避免重复搜索）
          if (router.redirect !== 'noRedirect') {
            res.push(data)
          }
        }

        // 递归处理子路由
        if (router.children) {
          const tempRoutes = this.generateRoutes(router.children, data.path, data.title)
          res = [...res, ...tempRoutes] // 合并子路由结果
        }
      }
      return res
    },
    querySearch(query) {
      if (query !== '') {
        // 调用 Fuse 搜索，结果赋值给 options（供 el-select 展示）
        this.options = this.fuse.search(query)
      } else {
        this.options = [] // 空输入时清空结果
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.header-search {
  font-size: 0 !important;

  // 调整组件整体宽度（根据需求修改，默认可能过宽）
  width: 180px !important;
  margin: 8px auto; // 上下间距+水平居中（适配侧边栏布局）

  .header-search-select {
    font-size: 13px !important; // 输入框字体缩小
    height: 30px !important; // 输入框高度（原默认 ~49px）

    // 穿透输入框内部样式
    ::v-deep .el-input__inner {
      height: 30px !important; // 输入框内部高度同步
      line-height: 30px !important; // 垂直居中
      font-size: 13px !important;
    }
  }

  &.show {
    .header-search-select {
      width: calc(100% - 24px) !important; // 减去图标和间距
      margin-left: 6px !important; // 缩小图标与输入框间距
    }
  }
}
</style>
