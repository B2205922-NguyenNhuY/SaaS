<template>
  <div class="success-page">
    <div class="success-card">
      <div class="success-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3d8c3d" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h1>Thanh toán thành công!</h1>
      <p>Gói cước của bạn đã được nâng cấp. Hạn mức mới đã được áp dụng.</p>
      <router-link to="/tenant-admin/plans" class="btn-primary">
        Xem gói cước của tôi
      </router-link>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap');
.success-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f7f4;
  font-family: 'Be Vietnam Pro', sans-serif;
}
.success-card {
  background: white;
  border: 1px solid #e2ede2;
  border-radius: 16px;
  padding: 48px 40px;
  text-align: center;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.success-icon {
  width: 80px; height: 80px;
  background: #eef7ee;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
h1 { font-size: 22px; font-weight: 600; color: #1a2e1a; margin: 0; }
p { font-size: 14px; color: #6b836b; margin: 0; line-height: 1.6; }
.btn-primary {
  display: inline-flex;
  align-items: center;
  height: 42px;
  padding: 0 24px;
  background: #3d8c3d;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Be Vietnam Pro', sans-serif;
  text-decoration: none;
  margin-top: 8px;
  transition: background 0.15s;
}
.btn-primary:hover { background: #2d6e2d; }
</style>