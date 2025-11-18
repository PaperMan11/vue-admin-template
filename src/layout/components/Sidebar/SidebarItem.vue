<template>
  <div v-if="!item.hidden">
    <!--
      单一子项渲染逻辑：
      当满足以下条件时直接显示子项，不显示父菜单：
      1. 只有一个可见子项
      2. 该子项没有子菜单或没有可见子菜单
      3. 父菜单不强制显示
    -->
    <template v-if="hasOneShowingChild(item.children,item) && (!onlyOneChild.children||onlyOneChild.noShowingChildren)&&!item.alwaysShow">
      <app-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path)">
        <el-menu-item
          :index="resolvePath(onlyOneChild.path)"
          :class="{'submenu-title-noDropdown':!isNest}"
        >
          <!-- 渲染菜单项图标和标题 -->
          <item
            :icon="onlyOneChild.meta.icon || (item.meta && item.meta.icon)"
            :title="onlyOneChild.meta.title"
          />
        </el-menu-item>
      </app-link>
    </template>

    <!--
      多级菜单渲染逻辑：
      当有多个可见子项时，显示可展开的子菜单
    -->
    <el-submenu
      v-else
      ref="subMenu"
      :index="resolvePath(item.path)"
      popper-append-to-body
    >
      <!-- 子菜单标题 -->
      <template slot="title">
        <item v-if="item.meta" :icon="item.meta && item.meta.icon" :title="item.meta.title" />
      </template>
      <!-- 递归渲染子菜单 -->
      <sidebar-item
        v-for="child in item.children"
        :key="child.path"
        :is-nest="true"
        :item="child"
        :base-path="resolvePath(child.path)"
        class="nest-menu"
      />
    </el-submenu>
  </div>
</template>

<script>
import path from 'path'
import { isExternal } from '@/utils/validate'
import Item from './Item'
import AppLink from './Link'
import FixiOSBug from './FixiOSBug'

export default {
  name: 'SidebarItem',
  components: { Item, AppLink },
  mixins: [FixiOSBug],
  props: {
    /**
     * 菜单项配置对象
     * @type {Object}
     * @required
     */
    item: {
      type: Object,
      required: true
    },
    /**
     * 是否为嵌套菜单
     * @type {Boolean}
     * @default false
     */
    isNest: {
      type: Boolean,
      default: false
    },
    /**
     * 基础路径，用于路径解析
     * @type {String}
     * @default ''
     */
    basePath: {
      type: String,
      default: ''
    }
  },
  data() {
    // To fix https://github.com/PanJiaChen/vue-admin-template/issues/237
    // TODO: refactor with render function
    this.onlyOneChild = null
    return {}
  },
  methods: {
    /**
     * 判断是否只有一个可见子项
     * @param {Array} children - 子菜单数组
     * @param {Object} parent - 父菜单对象
     * @returns {Boolean} 是否只有一个可见子项
     */
    hasOneShowingChild(children = [], parent) {
      // 过滤隐藏的子项
      const showingChildren = children.filter(item => {
        if (item.hidden) {
          return false
        } else {
          // 临时存储可见子项引用
          this.onlyOneChild = item
          return true
        }
      })

      // 当只有一个可见子项时，直接显示该子项
      if (showingChildren.length === 1) {
        return true
      }

      // 当没有可见子项时，创建一个虚拟子项（显示父菜单但无实际链接）
      if (showingChildren.length === 0) {
        this.onlyOneChild = {
          ...parent,
          path: '',
          noShowingChildren: true
        }
        return true
      }

      // 有多个可见子项，需要显示展开菜单
      return false
    },

    /**
     * 解析路径
     * @param {String} routePath - 路由路径
     * @returns {String} 解析后的绝对路径
     */
    resolvePath(routePath) {
      // 处理外部链接
      if (isExternal(routePath)) {
        return routePath
      }

      // 处理基础路径为外部链接的情况
      if (isExternal(this.basePath)) {
        return this.basePath
      }

      // 解析相对路径为绝对路径
      return path.resolve(this.basePath, routePath)
    }
  }
}
</script>
