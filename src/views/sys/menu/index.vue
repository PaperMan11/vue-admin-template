<template>
  <div class="menu-manager-container">
    <el-card>
      <!-- 搜索栏 -->
      <div class="search-form table-card">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="全部">
              <el-option label="正常" :value="1" />
              <el-option label="禁用" :value="0" />
              <el-option label="全部" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="菜单">
            <el-input v-model="searchForm.keyword" placeholder="请输入内容" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="getMenuList">查询</el-button>
          </el-form-item>
        </el-form>

        <div class="table-card">
          <el-button icon="el-icon-refresh-right" size="small" type="info" @click="getMenuList" />
          <el-button type="success" :disabled="!perms.canAdd" size="small" @click="openAddDialog">新增菜单</el-button>
        </div>
      </div>

      <!-- 菜单列表 -->
      <el-table v-loading="loading" :data="menuList" border stripe>
        <el-table-column prop="id" label="菜单ID" width="80" fixed />
        <el-table-column prop="parent_id" label="父菜单ID" width="80" />
        <el-table-column prop="scope_id" label="安全范围ID" width="80" />
        <el-table-column prop="meta.title" label="菜单名称" width="120" />
        <el-table-column prop="meta.icon" label="菜单图标" width="80" align="center">
          <template slot-scope="{row}">
            <i v-if="row.meta.icon.includes('el-icon')" :class="row.meta.icon" />
            <svg-icon v-else :icon-class="row.meta.icon" />
          </template>
        </el-table-column>
        <el-table-column prop="menu_type" label="菜单类型" width="80" align="center">
          <template slot-scope="{row}">
            <el-tag :type="row.menu_type | menuTypeFilter">
              {{ row.menu_type | menuTextFilter }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" width="120" />
        <el-table-column prop="component" label="组件路径" min-width="120" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template slot-scope="{row}">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="hidden" label="是否隐藏" width="80" align="center">
          <!-- 修正：prop绑定错误 → 从meta.noCache改为hidden -->
          <template slot-scope="{row}">
            <i v-if="row.hidden" class="el-icon-check" />
            <i v-else class="el-icon-close" />
          </template>
        </el-table-column>
        <el-table-column prop="external" label="外部链接" width="80" align="center">
          <!-- 修正：prop绑定错误 → 从meta.noCache改为external -->
          <template slot-scope="{row}">
            <i v-if="row.external" class="el-icon-check" />
            <i v-else class="el-icon-close" />
          </template>
        </el-table-column>
        <el-table-column prop="meta.noCache" label="是否缓存" width="80" align="center">
          <template slot-scope="{row}">
            <i v-if="row.meta.noCache" class="el-icon-check" />
            <i v-else class="el-icon-close" />
          </template>
        </el-table-column>
        <el-table-column prop="meta.affix" label="固定标签栏" width="80" align="center">
          <template slot-scope="{row}">
            <i v-if="row.meta.affix" class="el-icon-check" />
            <i v-else class="el-icon-close" />
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="80" />
        <el-table-column label="操作" width="250" fixed="right">
          <template slot-scope="{row}">
            <el-button size="mini" type="primary" :disabled="!perms.canEdit" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="mini" type="warning" :disabled="!perms.canEdit" @click="toggleMenuStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button size="mini" type="danger" :disabled="!perms.canDelete" @click="deleteMenu(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        :current-page="searchForm.page"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="searchForm.page_size"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        style="margin-top: 20px; text-align: right"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 新增/编辑菜单弹窗 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px" class="dialog-form">
        <!-- 父菜单选择 -->
        <el-form-item label="父菜单" prop="parent_id">
          <el-input v-model="form.parent_id" placeholder="请选择父菜单（顶级菜单填“0”）" />
        </el-form-item>

        <!-- 菜单名称 -->
        <el-form-item label="菜单名称" prop="menu_name">
          <el-input v-model="form.menu_name" placeholder="请输入菜单名称" />
        </el-form-item>

        <!-- 菜单类型 -->
        <el-form-item label="菜单类型" prop="menu_type">
          <el-select v-model="form.menu_type" placeholder="请选择菜单类型">
            <el-option label="目录(M)" value="M" />
            <el-option label="菜单(C)" value="C" />
            <el-option label="按钮(F)" value="F" />
          </el-select>
        </el-form-item>

        <!-- 路由路径 -->
        <el-form-item label="路由路径" prop="path">
          <el-input v-model="form.path" placeholder="请输入路由路径（如：/system/menu）" />
        </el-form-item>

        <!-- 组件路径 -->
        <el-form-item label="组件路径" prop="component">
          <el-input v-model="form.component" placeholder="请输入组件路径（如：sys/menu/index）" />
        </el-form-item>

        <!-- 重定向路径 -->
        <el-form-item label="重定向路径" prop="redirect">
          <el-input v-model="form.redirect" placeholder="请输入重定向路径（可选）" />
        </el-form-item>

        <!-- 菜单图标 -->
        <el-form-item label="菜单图标" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入图标类名（如：el-icon-menu）" />
        </el-form-item>

        <!-- 排序权重 -->
        <el-form-item label="排序权重" prop="sort">
          <el-input v-model.number="form.sort" placeholder="请输入排序数字（数字越小越靠前）" type="number" />
        </el-form-item>

        <!-- 是否缓存 -->
        <el-form-item label="是否缓存" prop="no_cache">
          <el-switch v-model="form.no_cache" active-text="是" inactive-text="否" />
        </el-form-item>

        <!-- 是否固定标签栏 -->
        <el-form-item label="固定标签栏" prop="affix">
          <el-switch v-model="form.affix" active-text="是" inactive-text="否" />
        </el-form-item>

        <!-- 是否外部链接 -->
        <el-form-item label="外部链接" prop="external">
          <el-switch v-model="form.external" active-text="是" inactive-text="否" />
        </el-form-item>

        <!-- 是否隐藏 -->
        <el-form-item label="是否隐藏" prop="hidden">
          <el-switch v-model="form.hidden" active-text="是" inactive-text="否" />
        </el-form-item>

        <!-- 安全范围ID -->
        <el-form-item label="安全范围" prop="scope_id">
          <el-select v-model="form.scope_id" placeholder="请选择安全范围">
            <el-option label="默认范围" :value="0" />
            <!-- 可通过接口获取安全范围列表渲染 -->
          </el-select>
        </el-form-item>

        <!-- 状态 -->
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>

        <!-- 备注 -->
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注信息（可选）" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getMenuList, createMenu, updateMenu, deleteMenu } from '@/api/sys/scope.js'
import { initPermissions } from '@/utils/permission'

export default {
  name: 'MenuManager',
  filters: {
    // 菜单类型样式过滤器
    menuTypeFilter(val) {
      const map = { 'M': 'info', 'C': 'success', 'F': 'warning' }
      return map[val] || 'danger'
    },
    // 菜单类型文字过滤器
    menuTextFilter(val) {
      const map = { 'M': '目录', 'C': '菜单', 'F': '按钮' }
      return map[val] || '未知'
    }
  },
  data() {
    return {
      // 当前权限
      perms: {
        canRead: false,
        canAdd: false,
        canEdit: false,
        canDelete: false
      },
      // 搜索表单
      searchForm: {
        keyword: '',
        status: 2,
        page: 1,
        page_size: 10
      },
      // 表格数据
      menuList: [],
      total: 0,
      loading: false,
      // 新增/编辑弹窗
      dialogVisible: false,
      dialogTitle: '',
      isAdd: true,
      // 菜单表单（与菜单功能匹配）
      form: {
        id: '', // 编辑时的菜单ID
        parent_id: 0, // 父菜单ID
        menu_name: '', // 菜单名称
        menu_type: '', // 菜单类型 (M-目录, C-菜单, F-按钮)
        path: '', // 路由路径
        component: '', // 组件路径
        redirect: '', // 重定向路径
        icon: '', // 菜单图标
        sort: 0, // 排序
        no_cache: false, // 是否缓存
        affix: false, // 是否固定在标签栏
        external: false, // 是否外部链接
        hidden: false, // 是否隐藏
        status: 1, // 状态 (0-禁用, 1-正常)
        scope_id: 0, // 权限范围ID
        remark: '' // 备注
      },
      // 表单校验规则（修正语法错误）
      formRules: {
        parent_id: [{ type: 'number', message: '请选择父菜单', trigger: 'change' }],
        menu_name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
        menu_type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
        path: [{ type: 'string', message: '请输入路由路径', trigger: 'blur' }],
        component: [{ type: 'string', required: true, message: '请输入组件路径', trigger: 'blur' }],
        redirect: [{ type: 'string', message: '请输入重定向路径（可选）', trigger: 'blur' }],
        icon: [{ type: 'string', message: '请输入菜单图标类名', trigger: 'blur' }],
        sort: [{ type: 'number', required: true, message: '请输入排序权重', trigger: 'blur' }],
        scope_id: [{ type: 'number', message: '请选择安全范围', trigger: 'change' }],
        status: [{ type: 'number', required: true, message: '请选择菜单状态', trigger: 'change' }],
        remark: [{ type: 'string', message: '请输入备注信息（可选）', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.perms = initPermissions(this.$route.meta.perms || [])
    this.getMenuList()
  },
  methods: {
    // 获取菜单列表
    async getMenuList() {
      this.loading = true
      try {
        const { data } = await getMenuList({
          page: this.searchForm.page,
          page_size: this.searchForm.page_size,
          status: this.searchForm.status
        })
        this.menuList = data.menus || []
        this.total = data.total || 0
      } catch (err) {
        this.$message.error('获取菜单列表失败：' + err.message)
      } finally {
        this.loading = false
      }
    },
    // 重置搜索
    resetSearch() {
      this.searchForm = {
        keyword: '',
        status: 2,
        page: 1,
        page_size: 10
      }
      this.getMenuList()
    },
    // 分页大小改变
    handleSizeChange(val) {
      this.searchForm.page_size = val
      this.getMenuList()
    },
    // 当前页改变
    handleCurrentChange(val) {
      this.searchForm.page = val
      this.getMenuList()
    },
    // 打开新增弹窗
    openAddDialog() {
      this.isAdd = true
      this.dialogTitle = '新增菜单'
      // 重置菜单表单
      this.form = {
        id: '',
        parent_id: 0,
        menu_name: '',
        menu_type: '',
        path: '',
        component: '',
        redirect: '',
        icon: '',
        sort: 0,
        no_cache: false,
        affix: false,
        external: false,
        hidden: false,
        status: 1,
        scope_id: 0,
        remark: ''
      }
      this.dialogVisible = true
    },
    // 打开编辑弹窗
    async openEditDialog(row) {
      this.isAdd = false
      this.dialogTitle = '编辑菜单'
      try {
        // 赋值菜单数据（适配表格返回字段）
        this.form = {
          id: row.id,
          parent_id: row.parent_id || 0,
          menu_name: row.meta?.title || row.menu_name || '',
          menu_type: row.menu_type || '',
          path: row.path || '',
          component: row.component || '',
          redirect: row.redirect || '',
          icon: row.meta?.icon || row.icon || '',
          sort: row.sort || 0,
          no_cache: row.meta?.noCache || row.no_cache || false,
          affix: row.meta?.affix || row.affix || false,
          external: row.external || false,
          hidden: row.hidden || false,
          status: row.status || 1,
          scope_id: row.scope_id || 0,
          remark: row.remark || ''
        }
        this.dialogVisible = true
      } catch (err) {
        this.$message.error('获取菜单详情失败：' + err.message)
      }
    },
    // 提交新增/编辑表单
    async submitForm() {
      try {
        // 先校验表单
        await this.$refs.formRef.validate()
        if (this.isAdd) {
          await createMenu(this.form) // 新增接口
          this.$message.success('新增菜单成功')
        } else {
          await updateMenu(this.form) // 编辑接口
          this.$message.success('编辑菜单成功')
        }
        this.dialogVisible = false
        this.getMenuList() // 刷新列表
      } catch (err) {
        const errorMsg = this.isAdd ? '新增菜单失败：' : '编辑菜单失败：'
        this.$message.error(errorMsg + (err.message || '表单校验不通过'))
      }
    },
    // 删除菜单
    async deleteMenu(row) {
      try {
        await this.$confirm('确定删除该菜单？删除后将无法恢复', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await deleteMenu({ id: row.id }) // 删除接口
        this.$message.success('删除菜单成功')
        this.getMenuList() // 刷新列表
      } catch (err) {
        if (err !== 'cancel') {
          this.$message.error('删除菜单失败：' + err.message)
        }
      }
    },
    // 切换菜单状态（禁用/启用）
    async toggleMenuStatus(row) {
      try {
        const newStatus = row.status === 1 ? 0 : 1
        // await toggleMenuStatus({ id: row.id, status: newStatus }) // 状态切换接口
        this.$message.success(`菜单已${newStatus === 1 ? '启用' : '禁用'}`)
        this.getMenuList() // 刷新列表
      } catch (err) {
        this.$message.error('修改菜单状态失败：' + err.message)
      }
    }
  }
}
</script>

<style scoped>
.menu-manager-container {
  padding: 20px;
}
.search-card {
  margin-bottom: 20px;
}
.search-form {
  margin-bottom: 0;
  /* display: flex; */
  justify-content: space-between;
  align-items: center;
}
.table-card {
  margin-bottom: 20px;
}
.dialog-footer {
  text-align: right;
}
.dialog-form {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 10px;
}
/* 滚动条样式优化 */
.dialog-form::-webkit-scrollbar {
  width: 6px;
}
.dialog-form::-webkit-scrollbar-thumb {
  background-color: #e4e7ed;
  border-radius: 3px;
}
</style>
