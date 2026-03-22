<template>
  <div>
    <div style="margin-bottom: 20px; display: flex; gap: 10px;">
      <button class="btn btn-primary" style="width: auto; padding: 10px 20px;" @click="openCreateModal">
        + Thêm người dùng
      </button>
    </div>

    <!-- Filter tabs -->
    <div style="margin-bottom: 20px; display: flex; gap: 10px; border-bottom: 1px solid #e0e0e0;">
      <button 
        v-for="tab in tabs" 
        :key="tab.value"
        @click="activeTab = tab.value; loadUsers()"
        :class="['tab-btn', { active: activeTab === tab.value }]"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="data-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Họ tên</th>
            <th>Email</th>
            <th>Số điện thoại</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.user_id">
            <td>{{ user.user_id }}</td>
            <td>{{ user.hoTen }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.soDienThoai }}</td>
            <td>
              <span :class="['role-badge', getRoleClass(user.tenVaiTro)]">
                {{ getRoleName(user.tenVaiTro) }}
              </span>
            </td>
            <td>
              <span :style="{ color: user.trangThai === 'active' ? '#4caf50' : '#f44336' }">
                {{ user.trangThai === 'active' ? 'Hoạt động' : 'Tạm dừng' }}
              </span>
            </td>
            <td>
              <button class="btn-sm btn-edit" @click="editUser(user)">Chỉnh sửa</button>
              <button 
                class="btn-sm btn-delete" 
                @click="toggleUserStatus(user)" 
                style="margin-left: 8px;"
              >
                {{ user.trangThai === 'active' ? 'Khóa' : 'Mở khóa' }}
              </button>
              <button 
                v-if="user.trangThai !== 'deleted'"
                class="btn-sm btn-delete" 
                @click="deleteUser(user)" 
                style="margin-left: 8px; background: #ff4444;"
              >
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit User Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <h3>{{ editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới' }}</h3>
        <form @submit.prevent="saveUser">
          <div class="form-group">
            <label>Họ tên</label>
            <input v-model="formData.hoTen" required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" v-model="formData.email" required />
          </div>
          <div class="form-group">
            <label>Số điện thoại</label>
            <input v-model="formData.soDienThoai" required />
          </div>
          <div class="form-group">
            <label>Vai trò</label>
            <select v-model="formData.role_id" required>
              <option v-for="role in roles" :key="role.role_id" :value="role.role_id">
                {{ role.tenVaiTro }}
              </option>
            </select>
          </div>
          <div v-if="!editingUser" class="form-group">
            <label>Mật khẩu</label>
            <input type="password" v-model="formData.password" required />
          </div>
          <div v-if="editingUser" class="form-group">
            <label>Mật khẩu mới (để trống nếu không đổi)</label>
            <input type="password" v-model="formData.newPassword" />
          </div>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary">{{ editingUser ? 'Cập nhật' : 'Tạo' }}</button>
            <button type="button" class="btn" @click="closeModal">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api'

interface User {
  user_id: number
  hoTen: string
  email: string
  soDienThoai: string
  tenVaiTro: string
  trangThai: 'active' | 'suspended' | 'deleted'
}

interface Role {
  role_id: number
  tenVaiTro: string
}

const users = ref<User[]>([])
const roles = ref<Role[]>([])
const activeTab = ref<'all' | 'tenant_admin' | 'collector' | 'merchant'>('all')
const showModal = ref(false)
const editingUser = ref<User | null>(null)
const formData = ref({
  hoTen: '',
  email: '',
  soDienThoai: '',
  role_id: '',
  password: '',
  newPassword: '',
})

const tabs = [
  { value: 'all', label: 'Tất cả' },
  { value: 'tenant_admin', label: 'Quản trị viên' },
  { value: 'collector', label: 'Nhân viên thu phí' },
  { value: 'merchant', label: 'Tiểu thương' },
]

const getRoleName = (role: string) => {
  const roleMap: Record<string, string> = {
    'TenantAdmin': 'Quản trị viên',
    'Collector': 'Nhân viên thu phí',
    'Merchant': 'Tiểu thương'
  }
  return roleMap[role] || role
}

const getRoleClass = (role: string) => {
  const classMap: Record<string, string> = {
    'TenantAdmin': 'role-admin',
    'Collector': 'role-collector',
    'Merchant': 'role-merchant'
  }
  return classMap[role] || ''
}

const loadRoles = async () => {
  try {
    const response = await api.get('/roles')
    // Filter only tenant-level roles
    roles.value = response.data.filter((r: Role) => 
      ['TenantAdmin', 'Collector', 'Merchant'].includes(r.tenVaiTro)
    )
  } catch (error) {
    console.error('Failed to load roles:', error)
  }
}

const loadUsers = async () => {
  try {
    let url = '/users'
    if (activeTab.value !== 'all') {
      url = `/users/role/${activeTab.value}`
    }
    const response = await api.get(url)
    users.value = response.data
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

const openCreateModal = () => {
  editingUser.value = null
  formData.value = {
    hoTen: '',
    email: '',
    soDienThoai: '',
    role_id: '',
    password: '',
    newPassword: '',
  }
  showModal.value = true
}

const editUser = (user: User) => {
  editingUser.value = user
  const role = roles.value.find(r => r.tenVaiTro === user.tenVaiTro)
  formData.value = {
    hoTen: user.hoTen,
    email: user.email,
    soDienThoai: user.soDienThoai,
    role_id: role?.role_id.toString() || '',
    password: '',
    newPassword: '',
  }
  showModal.value = true
}

const saveUser = async () => {
  try {
    if (editingUser.value) {
      const updateData: any = {
        hoTen: formData.value.hoTen,
        email: formData.value.email,
        soDienThoai: formData.value.soDienThoai,
        role_id: parseInt(formData.value.role_id),
      }
      if (formData.value.newPassword) {
        updateData.password = formData.value.newPassword
      }
      await api.put(`/users/${editingUser.value.user_id}`, updateData)
      alert('Cập nhật người dùng thành công')
    } else {
      await api.post('/users', {
        ...formData.value,
        role_id: parseInt(formData.value.role_id),
      })
      alert('Thêm người dùng thành công')
    }
    closeModal()
    await loadUsers()
  } catch (error) {
    console.error('Failed to save user:', error)
    alert('Lưu người dùng thất bại')
  }
}

const toggleUserStatus = async (user: User) => {
  try {
    const newStatus = user.trangThai === 'active' ? 'suspended' : 'active'
    await api.put(`/users/${user.user_id}`, { trangThai: newStatus })
    alert('Thay đổi trạng thái thành công')
    await loadUsers()
  } catch (error) {
    console.error('Failed to toggle status:', error)
    alert('Thay đổi trạng thái thất bại')
  }
}

const deleteUser = async (user: User) => {
  if (confirm(`Bạn có chắc muốn xóa người dùng "${user.hoTen}"?`)) {
    try {
      await api.delete(`/users/${user.user_id}`)
      alert('Xóa người dùng thành công')
      await loadUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Xóa người dùng thất bại')
    }
  }
}

const closeModal = () => {
  showModal.value = false
  editingUser.value = null
}

onMounted(() => {
  loadRoles()
  loadUsers()
})
</script>

<style scoped>
.tab-btn {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  color: #667eea;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.role-admin {
  background: #e3f2fd;
  color: #1976d2;
}

.role-collector {
  background: #fff3e0;
  color: #f57c00;
}

.role-merchant {
  background: #e8f5e9;
  color: #388e3c;
}
</style>