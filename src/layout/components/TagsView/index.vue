<template>
  <div id="tags-view-container" class="tags-view-container">
    <!-- 引入滚动面板组件，用于标签超出宽度时滚动 -->
    <scroll-pane ref="scrollPane" class="tags-view-wrapper" @scroll="handleScroll">
      <!-- 遍历访问过的视图，渲染为标签 -->
      <router-link
        v-for="tag in visitedViews"
        ref="tag"
        :key="tag.path"
        :class="isActive(tag)?'active':''"
        :to="{ path: tag.path, query: tag.query, fullPath: tag.fullPath }"
        tag="span"
        class="tags-view-item"
        @click.middle.native="!isAffix(tag)?closeSelectedTag(tag):''"
        @contextmenu.prevent.native="openMenu(tag,$event)"
      >
        {{ tag.title }}
        <!-- 非固定标签显示关闭按钮 -->
        <span v-if="!isAffix(tag)" class="el-icon-close" @click.prevent.stop="closeSelectedTag(tag)" />
      </router-link>
    </scroll-pane>
    <!-- 右键菜单 -->
    <ul v-show="visible" :style="{left:left+'px',top:top+'px'}" class="contextmenu">
      <li @click="refreshSelectedTag(selectedTag)">Refresh</li>
      <li v-if="!isAffix(selectedTag)" @click="closeSelectedTag(selectedTag)">Close</li>
      <!-- 关闭左侧标签 -->
      <li v-if="hasLeftTags()" @click="closeLeftTags()">Close Left</li>
      <!-- 关闭右侧标签 -->
      <li v-if="hasRightTags()" @click="closeRightTags()">Close Right</li>
      <li @click="closeOthersTags">Close Others</li>
      <li @click="closeAllTags(selectedTag)">Close All</li>
    </ul>
  </div>
</template>

<script>
import ScrollPane from './ScrollPane'
import path from 'path'

export default {
  components: { ScrollPane },
  data() {
    return {
      visible: false, // 右键菜单是否可见
      top: 0, // 右键菜单距离顶部位置
      left: 0, // 右键菜单距离左侧位置
      selectedTag: {}, // 当前选中的标签
      affixTags: [] // 固定标签（不可关闭）
    }
  },
  computed: {
    // 从store获取访问过的标签视图
    visitedViews() {
      return this.$store.state.tagsView.visitedViews
    },
    // 从store获取路由信息
    routes() {
      return this.$store.state.permission.routes
    }
  },
  watch: {
    // 监听路由变化，添加标签并滚动到当前标签
    $route() {
      this.addTags()
      this.moveToCurrentTag()
    },
    // 监听菜单可见性，添加/移除点击事件监听
    visible(value) {
      if (value) {
        document.body.addEventListener('click', this.closeMenu)
      } else {
        document.body.removeEventListener('click', this.closeMenu)
      }
    }
  },
  mounted() {
    // 初始化固定标签
    this.initTags()
    // 添加当前路由到标签
    this.addTags()
  },
  methods: {
    /**
     * 判断标签是否为当前激活状态
     * @param {Object} route - 标签对应的路由对象
     * @returns {boolean} 是否激活
     */
    isActive(route) {
      return route.path === this.$route.path
    },

    /**
     * 判断标签是否为固定标签
     * @param {Object} tag - 标签对象
     * @returns {boolean} 是否为固定标签
     */
    isAffix(tag) {
      return tag.meta && tag.meta.affix
    },

    /**
     * 过滤出固定标签
     * @param {Array} routes - 路由列表
     * @param {string} basePath - 基础路径
     * @returns {Array} 固定标签列表
     */
    filterAffixTags(routes, basePath = '/') {
      let tags = []
      routes.forEach(route => {
        // 有affix属性的路由视为固定标签
        if (route.meta && route.meta.affix) {
          const tagPath = path.resolve(basePath, route.path)
          tags.push({
            fullPath: tagPath,
            path: tagPath,
            name: route.name,
            meta: { ...route.meta }
          })
        }
        // 递归处理子路由
        if (route.children) {
          const tempTags = this.filterAffixTags(route.children, route.path)
          if (tempTags.length >= 1) {
            tags = [...tags, ...tempTags]
          }
        }
      })
      return tags
    },

    /**
     * 初始化固定标签
     */
    initTags() {
      const affixTags = this.affixTags = this.filterAffixTags(this.routes)
      // 将固定标签添加到访问过的视图
      for (const tag of affixTags) {
        if (tag.name) {
          this.$store.dispatch('tagsView/addVisitedView', tag)
        }
      }
    },

    /**
     * 添加当前路由到标签
     * @returns {boolean} 是否添加成功
     */
    addTags() {
      const { name } = this.$route
      // 有name属性的路由才添加标签
      if (name) {
        this.$store.dispatch('tagsView/addView', this.$route)
      }
      return false
    },

    /**
     * 滚动到当前激活的标签
     */
    moveToCurrentTag() {
      const tags = this.$refs.tag
      this.$nextTick(() => {
        for (const tag of tags) {
          // 找到当前激活的标签并滚动到可视区域
          if (tag.to.path === this.$route.path) {
            this.$refs.scrollPane.moveToTarget(tag)
            // 如果fullPath不同，更新访问过的视图
            if (tag.to.fullPath !== this.$route.fullPath) {
              this.$store.dispatch('tagsView/updateVisitedView', this.$route)
            }
            break
          }
        }
      })
    },

    /**
     * 刷新当前选中的标签
     * @param {Object} view - 标签对应的路由对象
     */
    refreshSelectedTag(view) {
      // 删除缓存并重新定向到该页面实现刷新
      this.$store.dispatch('tagsView/delCachedView', view).then(() => {
        const { fullPath } = view
        this.$nextTick(() => {
          this.$router.replace({
            path: '/redirect' + fullPath
          })
        })
      })
    },

    /**
     * 关闭选中的标签
     * @param {Object} view - 标签对应的路由对象
     */
    closeSelectedTag(view) {
      this.$store.dispatch('tagsView/delView', view).then(({ visitedViews }) => {
        // 如果关闭的是当前激活的标签，跳转到最后一个标签
        if (this.isActive(view)) {
          this.toLastView(visitedViews, view)
        }
      })
    },

    /**
     * 关闭其他标签
     */
    closeOthersTags() {
      // 跳转到选中的标签并关闭其他标签
      this.$router.push(this.selectedTag)
      this.$store.dispatch('tagsView/delOthersViews', this.selectedTag).then(() => {
        this.moveToCurrentTag()
      })
    },

    /**
     * 关闭所有标签
     * @param {Object} view - 标签对应的路由对象
     */
    closeAllTags(view) {
      this.$store.dispatch('tagsView/delAllViews').then(({ visitedViews }) => {
        // 如果关闭的是固定标签则不跳转
        if (this.affixTags.some(tag => tag.path === view.path)) {
          return
        }
        // 跳转到最后一个标签或首页
        this.toLastView(visitedViews, view)
      })
    },

    /**
     * 跳转到最后一个标签
     * @param {Array} visitedViews - 访问过的标签列表
     * @param {Object} view - 当前标签对象
     */
    toLastView(visitedViews, view) {
      const latestView = visitedViews.slice(-1)[0]
      if (latestView) {
        this.$router.push(latestView.fullPath)
      } else {
        // 如果没有标签了，跳转到首页或刷新首页
        if (view.name === 'Dashboard') {
          this.$router.replace({ path: '/redirect' + view.fullPath })
        } else {
          this.$router.push('/')
        }
      }
    },

    /**
     * 打开右键菜单
     * @param {Object} tag - 标签对象
     * @param {Event} e - 鼠标事件对象
     */
    openMenu(tag, e) {
      const menuMinWidth = 105
      const offsetLeft = this.$el.getBoundingClientRect().left // 容器左边距
      const offsetWidth = this.$el.offsetWidth // 容器宽度
      const maxLeft = offsetWidth - menuMinWidth // 菜单最大左偏移量
      const left = e.clientX - offsetLeft + 15 // 菜单左偏移量

      // 处理菜单超出容器的情况
      if (left > maxLeft) {
        this.left = maxLeft
      } else {
        this.left = left
      }

      this.top = e.clientY
      this.visible = true
      this.selectedTag = tag
    },

    /**
     * 关闭右键菜单
     */
    closeMenu() {
      this.visible = false
    },

    /**
     * 滚动时关闭菜单
     */
    handleScroll() {
      this.closeMenu()
    },

    /**
     * 判断是否有左侧标签可以关闭
     * @returns {boolean} 是否有可关闭的左侧标签
     */
    hasLeftTags() {
      const currentIndex = this.visitedViews.findIndex(tag => tag.path === this.selectedTag.path)
      // 过滤出当前标签左侧的非固定标签
      const leftTags = this.visitedViews.slice(0, currentIndex).filter(tag => !this.isAffix(tag))
      return leftTags.length > 0
    },

    /**
     * 判断是否有右侧标签可以关闭
     * @returns {boolean} 是否有可关闭的右侧标签
     */
    hasRightTags() {
      const currentIndex = this.visitedViews.findIndex(tag => tag.path === this.selectedTag.path)
      // 过滤出当前标签右侧的非固定标签
      const rightTags = this.visitedViews.slice(currentIndex + 1).filter(tag => !this.isAffix(tag))
      return rightTags.length > 0
    },

    /**
     * 关闭左侧所有标签
     */
    closeLeftTags() {
      this.$router.push(this.selectedTag)
      this.$store.dispatch('tagsView/delLeftViews', this.selectedTag).then(() => {
        this.moveToCurrentTag()
      })
    },

    /**
     * 关闭右侧所有标签
     */
    closeRightTags() {
      this.$router.push(this.selectedTag)
      this.$store.dispatch('tagsView/delRightViews', this.selectedTag).then(() => {
        this.moveToCurrentTag()
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.tags-view-container {
  height: 34px;
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #d8dce5;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, .12), 0 0 3px 0 rgba(0, 0, 0, .04);
  .tags-view-wrapper {
    .tags-view-item {
      display: inline-block;
      position: relative;
      cursor: pointer;
      height: 26px;
      line-height: 26px;
      border: 1px solid #d8dce5;
      color: #495060;
      background: #fff;
      padding: 0 8px;
      font-size: 12px;
      margin-left: 5px;
      margin-top: 4px;
      &:first-of-type {
        margin-left: 15px;
      }
      &:last-of-type {
        margin-right: 15px;
      }
      // 激活标签样式
      &.active {
        background-color: #42b983;
        color: #fff;
        border-color: #42b983;
        &::before {
          content: '';
          background: #fff;
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: relative;
          margin-right: 2px;
        }
      }
    }
  }
  // 右键菜单样式
  .contextmenu {
    margin: 0;
    background: #fff;
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 5px 0;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    color: #333;
    box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, .3);
    li {
      margin: 0;
      padding: 7px 16px;
      cursor: pointer;
      &:hover {
        background: #eee;
      }
    }
  }
}
</style>

<style lang="scss">
// 重置关闭图标样式
.tags-view-wrapper {
  .tags-view-item {
    .el-icon-close {
      width: 16px;
      height: 16px;
      vertical-align: 2px;
      border-radius: 50%;
      text-align: center;
      transition: all .3s cubic-bezier(.645, .045, .355, 1);
      transform-origin: 100% 50%;
      &:before {
        transform: scale(.6);
        display: inline-block;
        vertical-align: -3px;
      }
      &:hover {
        background-color: #b4bccc;
        color: #fff;
      }
    }
  }
}
</style>
