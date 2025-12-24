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

        <el-button icon="el-icon-refresh-right" size="small" type="info" @click="getMenuList" />
        <el-button type="success" :disabled="!perms.canAdd" size="small" @click="openAddDialog">新增用户</el-button>
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
            <svg-icon :icon-class="row.meta.icon" />
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
        <el-table-column prop="meta.noCache" label="是否隐藏" width="80" align="center">
          <template slot-scope="{row}">
            <i v-if="row.hidden" class="el-icon-check" />
            <i v-else class="el-icon-close" />
          </template>
        </el-table-column>
        <el-table-column prop="meta.noCache" label="外部链接" width="80" align="center">
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

    <!-- 新增/编辑用户弹窗 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item v-if="isAdd" label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="isAdd" label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="real_name">
          <el-input v-model="form.real_name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="form.mobile" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="form.gender" placeholder="请选择性别">
            <el-option label="未知" :value="0" />
            <el-option label="男" :value="1" />
            <el-option label="女" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isAdd" label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
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
import {
  getMenuList
} from '@/api/sys/scope.js'

import { initPermissions } from '@/utils/permission'

export default {
  name: 'MenuManager',
  filters: {
    // 性别样式过滤器
    menuTypeFilter(val) {
      const map = { 'M': 'info', 'C': 'success', 'F': 'warning' }
      return map[val] || 'danger'
    },
    // 性别文字过滤器
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
      form: {
        id: '',
        username: '',
        password: '',
        email: '',
        mobile: '',
        real_name: '',
        gender: 0,
        status: 1
      },
      // 表单校验规则
      formRules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
        real_name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
        email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
        mobile: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.perms = initPermissions(this.$route.meta.perms || [])
    this.getMenuList()
  },
  methods: {
    // 获取用户列表
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
      this.form = {
        id: '',
        username: '',
        password: '',
        email: '',
        mobile: '',
        real_name: '',
        gender: 0,
        status: 1
      }
      this.dialogVisible = true
    },
    // 打开编辑弹窗
    async openEditDialog(row) {
      this.isAdd = false
      this.dialogTitle = '编辑菜单'
      try {
        this.form = {
          id: row.id,
          username: row.username, // 编辑时用户名不可改
          password: '', // 编辑时不显示密码
          email: row.email,
          mobile: row.mobile,
          real_name: row.real_name,
          gender: row.gender,
          status: row.status
        }
        this.dialogVisible = true
      } catch (err) {
        this.$message.error('获取用户详情失败：' + err.message)
      }
    },
    // 提交新增/编辑表单
    async submitForm() {
      try {
        await this.$refs.formRef.validate()
        if (this.isAdd) {
          // await createMenu(this.form)
          this.$message.success('新增用户成功')
        } else {
          // await updateMenu(this.form)
          this.$message.success('编辑用户成功')
        }
        this.dialogVisible = false
        this.getMenuList()
      } catch (err) {
        this.$message.error(this.isAdd ? '新增用户失败' : '编辑用户失败' + err.message)
      }
    },
    // 删除用户
    async deleteMenu(row) {
      try {
        await this.$confirm('确定删除该用户？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        // await deleteMenu({ id: row.id })
        this.$message.success('删除用户成功')
        this.getMenuList()
      } catch (err) {
        if (err !== 'cancel') {
          this.$message.error('删除用户失败：' + err.message)
        }
      }
    },
    // 切换用户状态（禁用/启用）
    async toggleMenuStatus(row) {
      try {
        const newStatus = row.status === 1 ? 0 : 1
        // await toggleMenuStatus({
        //   user_id: row.id,
        //   status: newStatus
        // })
        this.$message.success(`用户已${newStatus === 1 ? '启用' : '禁用'}`)
        this.getMenuList()
      } catch (err) {
        this.$message.error('修改用户状态失败：' + err.message)
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
}
.table-card {
  margin-bottom: 20px;
}
.dialog-footer {
  text-align: right;
}
</style>
