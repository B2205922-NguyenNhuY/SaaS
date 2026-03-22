<template>
  <div>
    <div style="margin-bottom: 20px;">
      <button class="btn btn-primary" style="width: auto; padding: 10px 20px;" @click="showCreateModal = true">
        + Thêm chợ mới
      </button>
    </div>

    <div class="data-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên chợ</th>
            <th>Địa chỉ</th>
            <th>Số khu</th>
            <th>Số kiosk</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="market in markets" :key="market.id">
            <td>{{ market.id }}</td>
            <td>{{ market.name }}</td>
            <td>{{ market.address }}</td>
            <td>{{ market.zones }}</td>
            <td>{{ market.kiosks }}</td>
            <td>
              <span :style="{ color: market.status === 'active' ? '#4caf50' : '#f44336' }">
                {{ market.status === 'active' ? 'Hoạt động' : 'Tạm dừng' }}
              </span>
            </td>
            <td>
              <button @click="editMarket(market)">✏️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Market Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal" @click.stop>
        <h3>Thêm chợ mới</h3>
        <form @submit.prevent="createMarket">
          <div class="form-group">
            <label>Tên chợ</label>
            <input v-model="newMarket.name" required />
          </div>
          <div class="form-group">
            <label>Địa chỉ</label>
            <input v-model="newMarket.address" required />
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
const showCreateModal = ref(false)
const newMarket = ref({
  name: '',
  address: ''
})

const loadMarkets = async () => {
  // TODO: Call API to get markets
  markets.value = [
    { id: 1, name: 'Chợ Bến Thành', address: 'Quận 1, TP.HCM', zones: 5, kiosks: 150, status: 'active' },
    { id: 2, name: 'Chợ Bà Chiểu', address: 'Quận Bình Thạnh, TP.HCM', zones: 3, kiosks: 80, status: 'active' },
    { id: 3, name: 'Chợ Tân Định', address: 'Quận 1, TP.HCM', zones: 4, kiosks: 120, status: 'inactive' }
  ]
}

const createMarket = async () => {
  // TODO: Call API to create market
  console.log('Creating market:', newMarket.value)
  showCreateModal.value = false
  await loadMarkets()
}

const editMarket = (market) => {
  // TODO: Implement edit market
  console.log('Edit market:', market)
}

onMounted(() => {
  loadMarkets()
})
</script>

<style scoped>
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
</style>