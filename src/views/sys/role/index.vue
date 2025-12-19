<template>
  <div class="role-manager-container">
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
          <el-form-item label="角色名">
            <el-input v-model="searchForm.keyword" placeholder="请输入内容" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="getRoleList">查询</el-button>
          </el-form-item>
        </el-form>
        <div class="table-card">
          <el-button type="info" icon="el-icon-refresh-right" size="small" @click="getRoleList" />
          <el-button type="success" :disabled="!perms.canAdd" size="small" @click="openAddDialog">新增角色</el-button>
        </div>
      </div>

      <!-- 用户列表 -->
      <el-table v-loading="loading" :data="roleList" border stripe>
        <el-table-column prop="role_id" label="角色ID" width="100" fixed />
        <el-table-column prop="role_name" label="角色名" width="120" />
        <el-table-column prop="role_code" label="角色编码" width="120" />
        <el-table-column prop="description" label="角色描述" min-width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template slot-scope="{row}">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="400" fixed="right">
          <template slot-scope="{row}">
            <el-button size="mini" type="primary" :disabled="!perms.canEdit" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="mini" type="warning" :disabled="!perms.canEdit" @click="toggleRoleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button size="mini" type="info" :disabled="!perms.canEdit" @click="openAssignRoleDialog(row)">分配安全范围</el-button>
            <el-button size="mini" type="danger" :disabled="!perms.canDelete" @click="deleteRole(row)">删除</el-button>
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
        <el-form-item label="角色名" prop="role_name">
          <el-input v-model="form.role_name" placeholder="请输入角色名" />
        </el-form-item>
        <el-form-item v-if="isAdd" label="角色编码" prop="role_code">
          <el-input v-model="form.role_code" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入角色描述信息" />
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

    <!-- 分配权限弹窗 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="permDialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="permForm" label-width="100px">
        <el-form-item label="角色ID">
          <el-input v-model="permForm.role_id" disabled />
        </el-form-item>
        <el-form-item label="角色编码">
          <el-input v-model="permForm.role_code" disabled />
        </el-form-item>
        <el-form-item label="安全范围权限">
          <div v-for="scope in permForm.role_scopes" :key="scope.scope_code" class="scope-permissions">
            <div class="scope-header">
              <span>{{ scope.scope_name }}</span>
            </div>
            <el-checkbox-group v-model="scope.perms">
              <el-checkbox label="READ">读取</el-checkbox>
              <el-checkbox label="CREATE">创建</el-checkbox>
              <el-checkbox label="UPDATE">更新</el-checkbox>
              <el-checkbox label="DELETE">删除</el-checkbox>
            </el-checkbox-group>
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssignScope">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getRoleList, updateRole, createRole, deleteRole, getRolePerms, updateRolePerms, toggleRoleStatus } from '@/api/sys/role.js'
import { getAllScopes } from '@/api/sys/scope'
import { initPermissions } from '@/utils/permission'

export default {
  name: 'RoleManager',
  data() {
    return {
      // 当前权限
      perms: {
        canRead: false,
        canAdd: false,
        canEdit: false,
        canDelete: false
      },

      searchForm: {
        status: 2,
        keyword: '',
        page: 1,
        page_size: 10
      },
      // 表格数据
      scopeList: [],
      roleList: [],
      total: 0,
      loading: false,
      // 新增/编辑弹窗
      dialogVisible: false,
      dialogTitle: '',
      isAdd: true,
      form: {
        role_id: 0,
        role_name: '',
        role_code: '',
        description: '',
        status: 1
      },
      // 表单校验规则
      formRules: {
        role_name: [{ required: true, message: '请输入角色名', trigger: 'blur' }],
        description: [{ required: false, message: '请输入角色描述', trigger: 'blur' }]
      },
      // 分配权限弹窗相关数据
      permDialogVisible: false,
      permForm: {
        role_id: 0, // 角色ID
        role_code: '', // 角色编码
        role_scopes: []
      }
    }
  },
  created() {
    this.perms = initPermissions(this.$route.meta.perms || [])
    this.getRoleList()
    this.fetchScopes()
  },
  methods: {
    async getRoleList() {
      this.loading = true
      try {
        const { data } = await getRoleList({
          page: this.searchForm.page,
          page_size: this.searchForm.page_size,
          status: this.searchForm.status
        })
        this.roleList = data.roles || []
        this.total = data.page_response.total || 0
      } catch (error) {
        this.$message.error('获取角色列表失败')
      } finally {
        this.loading = false
      }
    },
    openAddDialog() {
      this.isAdd = true
      this.dialogTitle = '新增角色'
      this.form = {
        role_name: '',
        role_code: '',
        description: '',
        status: 1
      }
      this.dialogVisible = true
    },
    openEditDialog(row) {
      this.isAdd = false
      this.dialogTitle = '编辑角色'
      try {
        this.form = {
          role_name: row.role_name,
          role_code: row.role_code,
          description: row.description,
          status: row.status
        }
        this.dialogVisible = true
      } catch (error) {
        this.$message.error('加载角色信息失败')
      }
    },
    // 提交新增/编辑表单
    async submitForm() {
      try {
        await this.$refs.formRef.validate()
        if (this.isAdd) {
          await createRole(this.form)
          this.$message.success('新增角色成功')
        } else {
          await updateRole(this.form)
          this.$message.success('编辑角色成功')
        }
        this.dialogVisible = false
        this.getRoleList()
      } catch (err) {
        this.$message.error(this.isAdd ? '新增角色失败' : '编辑角色失败' + err.message)
      }
    },
    async openAssignRoleDialog(row) {
      this.dialogTitle = '分配权限'
      try {
        this.permForm.role_id = row.role_id
        this.permForm.role_code = row.role_code
        // 假设从接口获取角色的权限数据
        const { data } = await getRolePerms(row.role_code)
        const allScopes = this.scopeList.map(scope => {
          let rolePerms = []
          const s = data.scopes.find(s => s.scope_code === scope.scope_code)
          if (s) {
            rolePerms = s.perms || []
          }
          return {
            scope_code: scope.scope_code,
            scope_name: scope.scope_name,
            perms: rolePerms
          }
        })
        this.permForm.role_scopes = allScopes
        console.log('Loaded permissions for role:', this.permForm)
      } catch (error) {
        this.$message.error('加载权限数据失败')
      } finally {
        this.permDialogVisible = true
      }
    },
    async fetchScopes() {
      const { data } = await getAllScopes()
      this.scopeList = data.scopes || []
    },
    async toggleRoleStatus(row) {
      try {
        const newStatus = row.status === 1 ? 0 : 1
        await toggleRoleStatus({ role_code: row.role_code, status: newStatus })
        this.$message.success(`角色${newStatus === 1 ? '启用' : '禁用'}成功`)
        this.getRoleList()
      } catch (error) {
        this.$message.error('角色状态切换失败：' + error.message)
      }
    },
    async deleteRole(row) {
      try {
        await this.$confirm('确定要删除该角色吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        // 调用删除角色的接口
        await deleteRole({ role_code: row.role_code })
        this.$message.success('删除角色成功')
        this.getRoleList()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除角色失败：' + error.message)
        } else {
          this.$message.info('已取消删除')
        }
      }
    },
    handleSizeChange(size) {
      this.searchForm.page_size = size
      this.getRoleList()
    },
    handleCurrentChange(page) {
      this.searchForm.page = page
      this.getRoleList()
    },
    // 提交分配权限
    async submitAssignScope() {
      try {
        // const submitForm = this.permForm.scopes.filter(scope => scope.perms.length > 0)
        // console.log('Submitting assigned permissions:', submitForm)
        await updateRolePerms(this.permForm)
        this.permDialogVisible = false
        this.$message.success('分配权限成功')
      } catch (error) {
        this.$message.error('分配权限失败' + error.message)
      }
    }
  }
}
</script>

<style>
.role-manager-container {
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
.scope-permissions {
  margin-bottom: 20px;
}
.scope-header {
  font-weight: bold;
  /* margin-bottom: 5px; */
}
</style>
