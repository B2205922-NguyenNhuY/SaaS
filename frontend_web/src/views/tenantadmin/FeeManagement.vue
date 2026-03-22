<template>
  <div>
    <div style="margin-bottom: 20px; display: flex; gap: 10px;">
      <button class="btn btn-primary" style="width: auto; padding: 10px 20px;" @click="openCreateModal">
        + Thêm biểu phí
      </button>
    </div>

    <div class="data-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên biểu phí</th>
            <th>Hình thức</th>
            <th>Đơn giá</th>
            <th>Mô tả</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fee in fees" :key="fee.fee_id">
            <td>{{ fee.fee_id }}</td>
            <td>{{ fee.tenBieuPhi }}</td>
            <td>{{ fee.hinhThuc === 'ngay' ? 'Theo ngày' : 'Theo tháng' }}</td>
            <td>{{ formatCurrency(fee.donGia) }}</td>
            <td>{{ fee.moTa || '---' }}</td>
            <td>
              <button class="btn-sm btn-edit" @click="editFee(fee)">✏️</button>
              <button class="btn-sm btn-delete" @click="deleteFee(fee)" style="margin-left: 8px;">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Fee Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <h3>{{ editingFee ? 'Chỉnh sửa biểu phí' : 'Thêm biểu phí mới' }}</h3>
        <form @submit.prevent="saveFee">
          <div class="form-group">
            <label>Tên biểu phí</label>
            <input v-model="formData.tenBieuPhi" required />
          </div>
          <div class="form-group">
            <label>Hình thức thu</label>
            <select v-model="formData.hinhThuc" required>
              <option value="ngay">Theo ngày</option>
              <option value="thang">Theo tháng</option>
            </select>
          </div>
          <div class="form-group">
            <label>Đơn giá</label>
            <input type="number" v-model="formData.donGia" required />
          </div>
          <div class="form-group">
            <label>Mô tả</label>
            <textarea v-model="formData.moTa" rows="3"></textarea>
          </div>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary">{{ editingFee ? 'Cập nhật' : 'Tạo' }}</button>
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

const fees = ref<any[]>([])
const showModal = ref(false)
const editingFee = ref<any>(null)
const formData = ref({
  tenBieuPhi: '',
  hinhThuc: 'thang',
  donGia: 0,
  moTa: '',
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

const loadFees = async () => {
  try {
    const response = await api.get('/fees')
    fees.value = response.data
  } catch (error) {
    console.error('Failed to load fees:', error)
  }
}

const openCreateModal = () => {
  editingFee.value = null
  formData.value = {
    tenBieuPhi: '',
    hinhThuc: 'thang',
    donGia: 0,
    moTa: '',
  }
  showModal.value = true
}

const editFee = (fee: any) => {
  editingFee.value = fee
  formData.value = {
    tenBieuPhi: fee.tenBieuPhi,
    hinhThuc: fee.hinhThuc,
    donGia: fee.donGia,
    moTa: fee.moTa || '',
  }
  showModal.value = true
}

const saveFee = async () => {
  try {
    if (editingFee.value) {
      await api.put(`/fees/${editingFee.value.fee_id}`, formData.value)
      alert('Cập nhật biểu phí thành công')
    } else {
      await api.post('/fees', formData.value)
      alert('Thêm biểu phí thành công')
    }
    closeModal()
    await loadFees()
  } catch (error) {
    console.error('Failed to save fee:', error)
    alert('Lưu biểu phí thất bại')
  }
}

const deleteFee = async (fee: any) => {
  if (confirm(`Bạn có chắc muốn xóa biểu phí "${fee.tenBieuPhi}"?`)) {
    try {
      await api.delete(`/fees/${fee.fee_id}`)
      alert('Xóa biểu phí thành công')
      await loadFees()
    } catch (error) {
      console.error('Failed to delete fee:', error)
      alert('Xóa biểu phí thất bại')
    }
  }
}

const closeModal = () => {
  showModal.value = false
  editingFee.value = null
}

onMounted(() => {
  loadFees()
})
</script>

<style scoped>
textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
}

textarea:focus {
  outline: none;
  border-color: #667eea;
}
</style>