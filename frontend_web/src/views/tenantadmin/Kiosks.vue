<template>
  <div>
    <div style="margin-bottom: 20px; display: flex; gap: 10px;">
      <select v-model="filters.market_id" @change="loadKiosks" class="filter-select">
        <option value="">Tất cả chợ</option>
        <option v-for="market in markets" :key="market.id" :value="market.id">{{ market.name }}</option>
      </select>
      <select v-model="filters.status" @change="loadKiosks" class="filter-select">
        <option value="">Tất cả trạng thái</option>
        <option value="occupied">Đã thuê</option>
        <option value="empty">Trống</option>
      </select>
      <button class="btn btn-primary" style="width: auto; padding: 10px 20px;" @click="showCreateModal = true">
        + Thêm kiosk
      </button>
    </div>

    <div class="data-table">
      <table>
        <thead>
          <tr>
            <th>Mã kiosk</th>
            <th>Chợ</th>
            <th>Khu</th>
            <th>Vị trí</th>
            <th>Diện tích</th>
            <th>Tiểu thương</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="kiosk in kiosks" :key="kiosk.id">
            <td>{{ kiosk.code }}</td>
            <td>{{ kiosk.market_name }}</td>
            <td>{{ kiosk.zone }}</td>
            <td>{{ kiosk.location }}</td>
            <td>{{ kiosk.area }} m²</td>
            <td>{{ kiosk.merchant || '---' }}</td>
            <td>
              <span :style="{ color: kiosk.status === 'occupied' ? '#4caf50' : '#ff9800' }">
                {{ kiosk.status === 'occupied' ? 'Đã thuê' : 'Trống' }}
              </span>
            </td>
            <td>
              <button @click="editKiosk(kiosk)">✏️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Kiosk Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal" @click.stop>
        <h3>Thêm kiosk mới</h3>
        <form @submit.prevent="createKiosk">
          <div class="form-group">
            <label>Chợ</label>
            <select v-model="newKiosk.market_id" required>
              <option v-for="market in markets" :key="market.id" :value="market.id">{{ market.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Mã kiosk</label>
            <input v-model="newKiosk.code" required />
          </div>
          <div class="form-group">
            <label>Khu</label>
            <input v-model="newKiosk.zone" required />
          </div>
          <div class="form-group">
            <label>Vị trí</label>
            <input v-model="newKiosk.location" required />
          </div>
          <div class="form-group">
            <label>Diện tích (m²)</label>
            <input type="number" v-model="newKiosk.area" required />
          </div>
          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button type="submit" class="btn btn-primary">Tạo</button>
            <button type="button" @click="showCreateModal = false" class="btn">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const markets = ref([])
const kiosks = ref([])
const filters = ref({
  market_id: '',
  status: ''
})
const showCreateModal = ref(false)
const newKiosk = ref({
  market_id: '',
  code: '',
  zone: '',
  location: '',
  area: ''
})

const loadMarkets = async () => {
  // TODO: Call API to get markets
  markets.value = [
    { id: 1, name: 'Chợ Bến Thành' },
    { id: 2, name: 'Chợ Bà Chiểu' }
  ]
}

const loadKiosks = async () => {
  // TODO: Call API to get kiosks with filters
  kiosks.value = [
    { id: 1, code: 'K001', market_name: 'Chợ Bến Thành', zone: 'A', location: 'Lô 1', area: 12, merchant: 'Nguyễn Văn A', status: 'occupied' },
    { id: 2, code: 'K002', market_name: 'Chợ Bến Thành', zone: 'A', location: 'Lô 2', area: 15, merchant: 'Trần Thị B', status: 'occupied' },
    { id: 3, code: 'K003', market_name: 'Chợ Bà Chiểu', zone: 'B', location: 'Lô 1', area: 10, merchant: null, status: 'empty' }
  ]
}

const createKiosk = async () => {
  // TODO: Call API to create kiosk
  console.log('Creating kiosk:', newKiosk.value)
  showCreateModal.value = false
  await loadKiosks()
}

const editKiosk = (kiosk) => {
  // TODO: Implement edit kiosk
  console.log('Edit kiosk:', kiosk)
}

onMounted(() => {
  loadMarkets()
  loadKiosks()
})
</script>

<style scoped>
.filter-select {
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 14px;
  background: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
}

.modal h3 {
  margin-bottom: 20px;
}

select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
}
</style>