<template>
  <div>
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Tổng số chợ</h3>
        <div class="value">{{ stats.totalMarkets }}</div>
      </div>
      <div class="stat-card">
        <h3>Tổng số kiosk</h3>
        <div class="value">{{ stats.totalKiosks }}</div>
      </div>
      <div class="stat-card">
        <h3>Đang thuê</h3>
        <div class="value">{{ stats.occupiedKiosks }}</div>
      </div>
      <div class="stat-card">
        <h3>Thu tháng này</h3>
        <div class="value">{{ formatCurrency(stats.revenue) }}</div>
      </div>
    </div>

    <div class="data-table">
      <h3 style="padding: 20px; border-bottom: 1px solid #e0e0e0;">Kiosk mới nhất</h3>
      <table>
        <thead>
          <tr>
            <th>Mã kiosk</th>
            <th>Vị trí</th>
            <th>Diện tích</th>
            <th>Tiểu thương</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="kiosk in recentKiosks" :key="kiosk.id">
            <td>{{ kiosk.code }}</td>
            <td>{{ kiosk.location }}</td>
            <td>{{ kiosk.area }} m²</td>
            <td>{{ kiosk.merchant || 'Trống' }}</td>
            <td>
              <span :style="{ color: kiosk.status === 'occupied' ? '#4caf50' : '#ff9800' }">
                {{ kiosk.status === 'occupied' ? 'Đã thuê' : 'Trống' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const stats = ref({
  totalMarkets: 0,
  totalKiosks: 0,
  occupiedKiosks: 0,
  revenue: 0
})

const recentKiosks = ref([])

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

onMounted(async () => {
  // TODO: Call API to get data
  stats.value = {
    totalMarkets: 3,
    totalKiosks: 350,
    occupiedKiosks: 280,
    revenue: 125000000
  }
  
  recentKiosks.value = [
    { id: 1, code: 'K001', location: 'Khu A - Lô 1', area: 12, merchant: 'Nguyễn Văn A', status: 'occupied' },
    { id: 2, code: 'K002', location: 'Khu A - Lô 2', area: 15, merchant: 'Trần Thị B', status: 'occupied' },
    { id: 3, code: 'K003', location: 'Khu B - Lô 1', area: 10, merchant: null, status: 'empty' }
  ]
})
</script>