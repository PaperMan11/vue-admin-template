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
            <el-button type="primary" size="small" @click="getScopeList">查询</el-button>
          </el-form-item>
        </el-form>
        <div class="table-card">
          <el-button type="info" icon="el-icon-refresh-right" size="small" @click="getScopeList" />
          <el-button type="success" :disabled="!perms.canAdd" size="small" @click="openAddDialog">新增安全范围</el-button>
        </div>
      </div>

      <!-- 安全范围列表 -->
      <el-table v-loading="loading" :data="scopeList" border stripe>
        <el-table-column prop="id" label="安全范围ID" width="100" fixed />
        <el-table-column prop="scope_name" label="安全范围名称" width="120" />
        <el-table-column prop="scope_code" label="安全范围编码" width="120" />
        <el-table-column prop="description" label="安全范围描述" min-width="120" />
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
            <el-button size="mini" type="warning" :disabled="!perms.canEdit" @click="toggleScopeStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button size="mini" type="info" :disabled="!perms.canEdit" @click="openAssignMenusDialog(row)">分配菜单</el-button>
            <el-button size="mini" type="danger" :disabled="!perms.canDelete" @click="deleteScope(row)">删除</el-button>
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

    <!-- 新增/编辑安全范围弹窗 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="名称" prop="scope_name">
          <el-input v-model="form.scope_name" placeholder="请输入安全范围名称" />
        </el-form-item>
        <el-form-item v-if="isAdd" label="编码" prop="scope_code">
          <el-input v-model="form.scope_code" placeholder="请输入安全范围编码" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入安全范围描述信息" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" size="small" :min="0" />
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

    <!-- 分配菜单弹窗 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="menusDialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <!-- 关键修改：添加根菜单按钮的父容器，设置flex布局 -->
      <div class="scope-permissions-header" style="margin-bottom: 10px; display: flex; justify-content: flex-end;">
        <el-button
          type="text"
          size="mini"
          icon="el-icon-plus"
          @click="() => append(null)"
        >
          添加根菜单
        </el-button>
      </div>

      <div class="scope-permissions">
        <el-tree
          :data="scopeMenusForm.menus"
          node-key="id"
          default-expand-all
          highlight-current
          :expand-on-click-node="false"
        >
          <span slot-scope="{ node, data }" class="custom-tree-node">
            <span>{{ data.meta.title }}</span>
            <span>
              <el-button
                type="text"
                size="mini"
                @click="() => append(data)"
              >
                Append
              </el-button>
              <el-button
                type="text"
                size="mini"
                @click="() => remove(node, data)"
              >
                Delete
              </el-button>
            </span>
          </span>
        </el-tree>
      </div>

      <el-dialog
        width="500px"
        title="添加菜单"
        :visible.sync="addMenuDialogVisible"
        append-to-body
      >
        <el-tree
          ref="unassignedMenuTree"
          :data="unassignedMenus"
          show-checkbox
          node-key="id"
          default-expand-all
          highlight-current
          :expand-on-click-node="false"
          :check-strictly="true"
          @check-change="checkMenu"
        >
          <span slot-scope="{ data }" class="custom-tree-node">
            <span>{{ data.meta.title }}</span>
          </span>
        </el-tree>
        <span slot="footer" class="dialog-footer">
          <el-button @click="cancelAddMenu">取消</el-button> <!-- 新增取消方法，清空勾选 -->
          <el-button type="primary" @click="submitAddMenu">确定</el-button>
        </span>
      </el-dialog>
      <span slot="footer" class="dialog-footer">
        <el-button @click="menusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssignMenus">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getScopeList, createScope, updateScope, toggleScopeStatus, deleteScope, getScopeMenus, getUnassignedScopeMenus } from '@/api/sys/scope'
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
      total: 0,
      loading: false,
      // 新增/编辑弹窗
      dialogVisible: false,
      dialogTitle: '',
      isAdd: true,
      form: {
        id: 0,
        scope_name: '',
        scope_code: '',
        description: '',
        sort: 0,
        status: 1
      },
      // 表单校验规则
      formRules: {
        scope_name: [{ required: true, message: '请输入安全范围名称', trigger: 'blur' }],
        description: [{ required: false, message: '请输入安全范围描述', trigger: 'blur' }],
        sort: [{ required: false, message: '请输入排序值', trigger: 'blur' }]
      },
      // 分配菜单弹窗
      unassignedMenus: [], // 未分配的菜单列表
      addMenusForm: {
        parent: null, // 用于存储当前添加子菜单的父菜单
        menus: []
      },
      menusDialogVisible: false,
      scopeMenusForm: {
        scope_id: 0,
        scope_code: '',
        menus: []
      },
      addMenuDialogVisible: false
    }
  },
  created() {
    this.perms = initPermissions(this.$route.meta.perms || [])
    this.getScopeList()
  },
  methods: {
    async getScopeList() {
      this.loading = true
      try {
        const { data } = await getScopeList({
          page: this.searchForm.page,
          page_size: this.searchForm.page_size,
          status: this.searchForm.status
        })
        this.scopeList = data.scopes || []
        this.total = data.total || 0
      } catch (error) {
        this.$message.error('获取安全范围列表失败' + error.message)
      } finally {
        this.loading = false
      }
    },
    async fetchUnassignedMenus() {
      try {
        const { data } = await getUnassignedScopeMenus()
        this.unassignedMenus = data.menus || []
      } catch (error) {
        this.$message.error('获取未分配菜单失败' + error.message)
      }
    },
    openAddDialog() {
      this.isAdd = true
      this.dialogTitle = '新增安全范围'
      this.form = {
        id: 0,
        scope_name: '',
        scope_code: '',
        description: '',
        sort: 0,
        status: 1
      }
      this.dialogVisible = true
    },
    openEditDialog(row) {
      this.isAdd = false
      this.dialogTitle = '编辑安全范围'
      try {
        this.form = {
          id: row.id,
          scope_name: row.scope_name,
          scope_code: row.scope_code,
          description: row.description,
          sort: row.sort,
          status: row.status
        }
        this.dialogVisible = true
      } catch (error) {
        this.$message.error('加载编辑安全范围信息失败')
      }
    },
    // 提交新增/编辑表单
    async submitForm() {
      try {
        await this.$refs.formRef.validate()
        if (this.isAdd) {
          await createScope(this.form)
          this.$message.success('新增安全范围成功')
        } else {
          await updateScope(this.form)
          this.$message.success('编辑安全范围成功')
        }
        this.dialogVisible = false
        this.getScopeList()
      } catch (err) {
        this.$message.error(this.isAdd ? '新增安全范围失败' : '编辑安全范围失败' + err.message)
      }
    },
    // 菜单分配
    async openAssignMenusDialog(row) {
      this.dialogTitle = '分配菜单'
      try {
        const { data } = await getScopeMenus(row.id)
        this.scopeMenusForm = {
          scope_id: row.id,
          scope_code: row.scope_code,
          menus: data.menus || []
        }
      } catch (error) {
        this.$message.error('加载菜单数据失败' + error.message)
      } finally {
        this.menusDialogVisible = true
      }
    },
    async append(nodeData) {
      // 过滤辅助函数(判断菜单是否已存在)
      const exists = (menu, menuList) => {
        for (const m of menuList) {
          if (m.id === menu.id) {
            return true
          }
          if (m.children && m.children.length > 0) {
            if (exists(menu, m.children)) {
              return true
            }
          }
        }
        return false
      }
      try {
        const { data } = await getUnassignedScopeMenus()
        this.unassignedMenus = data.menus || []
        // 过滤掉已经存在的菜单
        this.unassignedMenus = this.unassignedMenus.filter(menu => !exists(menu, this.scopeMenusForm.menus))
        this.addMenusForm = {
          parent: nodeData, // nodeData为null时表示添加根菜单
          menus: []
        }
        // 清空之前的勾选状态
        this.$nextTick(() => {
          if (this.$refs.unassignedMenuTree) {
            this.$refs.unassignedMenuTree.setCheckedKeys([])
          }
        })
      } catch (error) {
        this.$message.error('获取未分配菜单失败' + error.message)
      } finally {
        this.addMenuDialogVisible = true
      }
    },
    remove(node, data) {
      const parent = node.parent
      const children = parent.data.children || parent.data
      const index = children.findIndex(d => d.id === data.id)
      children.splice(index, 1)
    },
    checkMenu(data, checkedNodes) {
      if (checkedNodes) {
        // 去重添加
        if (!this.addMenusForm.menus.some(m => m.id === data.id)) {
          this.addMenusForm.menus.push(data)
        }
      } else {
        const index = this.addMenusForm.menus.findIndex(d => d.id === data.id)
        if (index !== -1) {
          this.addMenusForm.menus.splice(index, 1)
        }
      }
    },
    // 取消添加菜单，清空勾选
    cancelAddMenu() {
      this.addMenuDialogVisible = false
      this.addMenusForm.menus = []
      if (this.$refs.unassignedMenuTree) {
        this.$refs.unassignedMenuTree.setCheckedKeys([])
      }
    },
    submitAddMenu() {
      if (this.addMenusForm.menus.length === 0) {
        this.$message.error('请选择要添加的菜单')
        return
      }
      // 添加根菜单（parent为null）
      if (!this.addMenusForm.parent) {
        this.scopeMenusForm.menus.push(...this.addMenusForm.menus)
      } else {
        // 添加子菜单
        if (!this.addMenusForm.parent.children) {
          this.$set(this.addMenusForm.parent, 'children', [])
        }
        this.addMenusForm.parent.children.push(...this.addMenusForm.menus)
      }
      this.addMenuDialogVisible = false
      this.unassignedMenus = [] // 清空未分配菜单列表
      this.$message.success('菜单添加成功')
    },
    submitAssignMenus() {
      this.$message.success('分配菜单成功')
      console.log('分配的菜单：', this.scopeMenusForm.menus)
      // todo: 调用接口保存分配的菜单
      this.menusDialogVisible = false
    },
    // 禁用安全范围
    async toggleScopeStatus(row) {
      try {
        const newStatus = row.status === 1 ? 0 : 1
        await toggleScopeStatus({ scope_code: row.scope_code, status: newStatus })
        this.$message.success(`安全范围状态${newStatus === 1 ? '启用' : '禁用'}成功`)
        this.getScopeList()
      } catch (error) {
        this.$message.error('安全范围状态切换失败：' + error.message)
      }
    },
    // 删除安全范围
    async deleteScope(row) {
      try {
        await this.$confirm('确定要删除该安全范围吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        // 调用删除角色的接口
        await deleteScope({ id: row.id })
        this.$message.success('删除安全范围成功')
        this.getScopeList()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除安全范围失败：' + error.message)
        } else {
          this.$message.info('已取消删除')
        }
      }
    },
    handleSizeChange(size) {
      this.searchForm.page_size = size
      this.getScopeList()
    },
    handleCurrentChange(page) {
      this.searchForm.page = page
      this.getScopeList()
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
  max-height: 400px;
  overflow-y: auto;
}
.scope-header {
  font-weight: bold;
  margin-bottom: 10px;
}
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}
/* 可选：优化添加根菜单按钮的样式 */
.scope-permissions-header .el-button {
  color: #1890ff;
  margin-bottom: 5px;
}
</style>
