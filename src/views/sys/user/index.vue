<template>
  <div class="user-manager-container">
    <el-card>
      <!-- 搜索栏 -->
      <div class="search-form table-card">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="全部">
              <el-option label="正常" value="1" />
              <el-option label="禁用" value="0" />
            </el-select>
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="searchForm.keyword" placeholder="请输入内容" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="getUserList">查询</el-button>
          </el-form-item>
        </el-form>

        <el-button icon="el-icon-refresh-right" size="small" type="info" @click="getUserList" />
        <el-button type="success" size="small" @click="openAddDialog">新增用户</el-button>
      </div>

      <!-- 用户列表 -->
      <el-table v-loading="loading" :data="userList" border stripe>
        <el-table-column prop="id" label="用户ID" width="100" fixed />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="real_name" label="真实姓名" width="120" />
        <el-table-column prop="email" label="邮箱" min-width="120" />
        <el-table-column prop="mobile" label="手机号" width="120" />
        <el-table-column prop="gender" label="性别" width="80">
          <template slot-scope="{row}">
            <el-tag :type="row.gender | genderTypeFilter">
              {{ row.gender | genderTextFilter }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template slot-scope="{row}">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="400" fixed="right">
          <template slot-scope="{row}">
            <el-button size="mini" type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="mini" type="warning" @click="toggleUserStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button size="mini" type="info" @click="assignUserRole(row)">分配角色</el-button>
            <el-button size="mini" type="danger" @click="deleteUser(row)">删除</el-button>
            <el-button size="mini" type="text" @click="resetUserPassword(row)">重置密码</el-button>
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
            <el-option label="未知" value="0" />
            <el-option label="男" value="1" />
            <el-option label="女" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isAdd" label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="正常" value="1" />
            <el-option label="禁用" value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </span>
    </el-dialog>

    <!-- 分配角色弹窗 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="roleDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="roleForm" label-width="100px">
        <el-form-item label="用户ID">
          <el-input v-model="roleForm.user_id" disabled />
        </el-form-item>
        <el-form-item label="角色列表">
          <el-select
            v-model="roleForm.role_codes"
            multiple
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roleList"
              :key="role.role_code"
              :label="role.role_name"
              :value="role.role_code"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssignRole">确定</el-button>
      </span>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog
      title="重置用户密码"
      :visible.sync="pwdDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="100px">
        <el-form-item label="用户ID">
          <el-input v-model="pwdForm.user_id" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input v-model="pwdForm.password" type="password" placeholder="请输入新密码" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="pwdDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitResetPwd">确定</el-button>
      </span>
    </el-dialog>

    <!-- 修改自身密码弹窗 -->
    <el-dialog
      title="修改密码"
      :visible.sync="selfPwdDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form ref="selfPwdFormRef" :model="selfPwdForm" :rules="selfPwdRules" label-width="100px">
        <el-form-item label="旧密码" prop="old_password">
          <el-input v-model="selfPwdForm.old_password" type="password" placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="selfPwdForm.new_password" type="password" placeholder="请输入新密码" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="selfPwdDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSelfPwd">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  assignUserRole,
  updatePassword,
  updateUserPassword,
  getUserById
} from '@/api/sys/user.js'

import { getAllRoles } from '@/api/sys/role.js'

export default {
  name: 'UserManager',
  filters: {
    // 性别样式过滤器
    genderTypeFilter(val) {
      const map = { 1: 'info', 2: 'success' }
      return map[val] || 'warning'
    },
    // 性别文字过滤器
    genderTextFilter(val) {
      const map = { 1: '男', 2: '女' }
      return map[val] || '未知'
    }
  },
  data() {
    return {
      // 搜索表单
      searchForm: {
        keyword: '',
        status: '1',
        page: 1,
        page_size: 10
      },
      // 表格数据
      userList: [],
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
      },
      // 分配角色弹窗
      roleDialogVisible: false,
      roleForm: {
        user_id: '',
        role_codes: []
      },
      roleList: [
        // 实际需从接口获取角色列表
        // { code: 'admin', name: '超级管理员' },
        // { code: 'editor', name: '编辑' },
        // { code: 'viewer', name: '查看者' }
      ],
      // 重置密码弹窗
      pwdDialogVisible: false,
      pwdForm: {
        user_id: '',
        password: ''
      },
      pwdRules: {
        password: [{ required: true, message: '请输入新密码', trigger: 'blur' }]
      },
      // 修改自身密码弹窗
      selfPwdDialogVisible: false,
      selfPwdForm: {
        old_password: '',
        new_password: ''
      },
      selfPwdRules: {
        old_password: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
        new_password: [{ required: true, message: '请输入新密码', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getUserList()
    this.fetchUserRoles()
  },
  methods: {
    // 获取用户列表
    async getUserList() {
      this.loading = true
      try {
        const { data } = await getUserList({
          page: this.searchForm.page,
          page_size: this.searchForm.page_size,
          status: this.searchForm.status ? Number(this.searchForm.status) : 1
        })
        this.userList = data.users || []
        this.total = data.total || 0
      } catch (err) {
        this.$message.error('获取用户列表失败：' + err.message)
      } finally {
        this.loading = false
      }
    },
    // 重置搜索
    resetSearch() {
      this.searchForm = {
        status: '',
        page: 1,
        page_size: 10
      }
      this.getUserList()
    },
    // 分页大小改变
    handleSizeChange(val) {
      this.searchForm.page_size = val
      this.getUserList()
    },
    // 当前页改变
    handleCurrentChange(val) {
      this.searchForm.page = val
      this.getUserList()
    },
    // 打开新增弹窗
    openAddDialog() {
      this.isAdd = true
      this.dialogTitle = '新增用户'
      this.form = {
        id: '',
        username: '',
        password: '',
        email: '',
        mobile: '',
        real_name: '',
        gender: '0',
        status: '1'
      }
      this.dialogVisible = true
    },
    // 打开编辑弹窗
    async openEditDialog(row) {
      this.isAdd = false
      this.dialogTitle = '编辑用户'
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
          await createUser(this.form)
          this.$message.success('新增用户成功')
        } else {
          await updateUser(this.form)
          this.$message.success('编辑用户成功')
        }
        this.dialogVisible = false
        this.getUserList()
      } catch (err) {
        this.$message.error(this.isAdd ? '新增用户失败' : '编辑用户失败' + err.message)
      }
    },
    // 删除用户
    async deleteUser(row) {
      try {
        await this.$confirm('确定删除该用户？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await deleteUser({ id: row.id })
        this.$message.success('删除用户成功')
        this.getUserList()
      } catch (err) {
        if (err !== 'cancel') {
          this.$message.error('删除用户失败：' + err.message)
        }
      }
    },
    // 切换用户状态（禁用/启用）
    async toggleUserStatus(row) {
      try {
        const newStatus = row.status === 1 ? 0 : 1
        await toggleUserStatus({
          user_id: row.id,
          status: newStatus
        })
        this.$message.success(`用户已${newStatus === 1 ? '启用' : '禁用'}`)
        this.getUserList()
      } catch (err) {
        this.$message.error('修改用户状态失败：' + err.message)
      }
    },
    // 打开分配角色弹窗
    async assignUserRole(row) {
      this.dialogTitle = '分配角色'
      try {
        // 当前用户角色列表
        const res = await getUserById(row.id)
        this.roleForm = {
          user_id: row.id,
          role_codes: res.data.roles.map(role => role.role_code) // 实际需回显用户已有角色
        }
      } catch (err) {
        this.$message.error('获取角色列表失败：' + err.message)
      } finally {
        this.roleDialogVisible = true
      }
    },

    async fetchUserRoles() {
      const { data } = await getAllRoles()
      this.roleList = data.roles || []
    },

    // 提交分配角色
    async submitAssignRole() {
      try {
        await assignUserRole(this.roleForm)
        this.$message.success('分配角色成功')
        this.roleDialogVisible = false
        this.getUserList()
      } catch (err) {
        this.$message.error('分配角色失败：' + err.message)
      }
    },
    // 打开重置密码弹窗
    resetUserPassword(row) {
      this.pwdForm = {
        user_id: row.id,
        password: ''
      }
      this.pwdDialogVisible = true
    },
    // 提交重置密码
    async submitResetPwd() {
      try {
        await this.$refs.pwdFormRef.validate()
        await updatePassword(this.pwdForm)
        this.$message.success('重置密码成功')
        this.pwdDialogVisible = false
      } catch (err) {
        this.$message.error('重置密码失败：' + err.message)
      }
    },
    // 打开修改自身密码弹窗
    openSelfPwdDialog() {
      this.selfPwdForm = {
        old_password: '',
        new_password: ''
      }
      this.selfPwdDialogVisible = true
    },
    // 提交修改自身密码
    async submitSelfPwd() {
      try {
        await this.$refs.selfPwdFormRef.validate()
        await updateUserPassword(this.selfPwdForm)
        this.$message.success('修改密码成功，请重新登录')
        this.selfPwdDialogVisible = false
        // 此处可添加退出登录逻辑
      } catch (err) {
        this.$message.error('修改密码失败：' + err.message)
      }
    }
  }
}
</script>

<style scoped>
.user-manager-container {
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
