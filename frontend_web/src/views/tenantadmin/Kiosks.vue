<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý Kiosk</h1>
        <p class="page-sub">Sạp / quầy, loại kiosk và phân quầy cho tiểu thương</p>
      </div>
      <button class="btn-primary" @click="openCreate">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        {{ activeTab === 'kiosks' ? 'Thêm Kiosk' : activeTab === 'types' ? 'Thêm Loại' : 'Phân quầy' }}
      </button>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ 'tab--active': activeTab === 'kiosks' }" @click="switchTab('kiosks')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
        Danh sách Kiosk
      </button>
      <button class="tab" :class="{ 'tab--active': activeTab === 'types' }" @click="switchTab('types')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        Loại Kiosk
      </button>
      <button class="tab" :class="{ 'tab--active': activeTab === 'assignments' }" @click="switchTab('assignments')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        Phân quầy
      </button>
    </div>

    <template v-if="activeTab === 'kiosks'">
      <div class="filter-bar">
        <div class="search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="kFilters.q" placeholder="Tìm mã kiosk, vị trí..." @input="debouncedK" />
        </div>
        <select v-model="kFilters.market_id" @change="onMarketChange">
          <option value="">Tất cả chợ</option>
          <option v-for="m in markets" :key="m.market_id" :value="m.market_id">{{ m.tenCho }}</option>
        </select>
        <select v-model="kFilters.zone_id" @change="fetchKiosks">
          <option value="">Tất cả khu</option>
          <option v-for="z in filteredZones" :key="z.zone_id" :value="z.zone_id">{{ z.tenKhu }}</option>
        </select>
        <select v-model="kFilters.trangThai" @change="fetchKiosks">
          <option value="">Tất cả TT</option>
          <option value="available">Trống</option>
          <option value="occupied">Đang thuê</option>
          <option value="maintenance">Bảo trì</option>
          <option value="locked">Khóa</option>
        </select>
        <button class="btn-outline" @click="resetKFilters">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
          Reset
        </button>
      </div>

      <div class="quota-bar" v-if="quota.max">
        <div class="quota-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          <span>Đã dùng <strong>{{ quota.used }}</strong> / <strong>{{ quota.max }}</strong> kiosk</span>
        </div>
        <div class="quota-track"><div class="quota-fill" :style="{ width: quotaPct + '%' }" :class="{ 'quota-fill--warn': quotaPct >= 80 }"></div></div>
      </div>

      <div class="table-panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã Kiosk</th>
                <th>Khu / Chợ</th>
                <th>Loại</th>
                <th>Vị trí</th>
                <th>Diện tích</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="kLoading"><td colspan="7"><div class="loading-bar"></div></td></tr>
              <template v-else>
                <tr v-for="k in kiosks" :key="k.kiosk_id">
                  <td><span class="kiosk-code">{{ k.maKiosk }}</span></td>
                  <td>
                    <div class="cell-stack">
                      <span class="cell-main">{{ k.tenKhu }}</span>
                      <span class="cell-sub">{{ k.tenCho }}</span>
                    </div>
                  </td>
                  <td><span class="type-chip">{{ k.tenLoai }}</span></td>
                  <td class="cell-sub">{{ k.viTri || '—' }}</td>
                  <td class="cell-sub">{{ k.dienTich ? k.dienTich + ' m²' : '—' }}</td>
                  <td><span class="badge" :class="kioskStatusClass(k.trangThai)">{{ kioskStatusLabel(k.trangThai) }}</span></td>
                  <td>
                    <div class="action-btns">
                      <button class="icon-btn" title="Chỉnh sửa" @click="openEditKiosk(k)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button class="icon-btn" title="Đổi trạng thái" @click="openStatusModal(k)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                      </button>
                      <button v-if="k.trangThai === 'available'" class="icon-btn icon-btn--blue" title="Phân quầy nhanh" @click="quickAssign(k)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!kiosks.length">
                  <td colspan="7" class="empty-row">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                    <p>Chưa có kiosk nào</p>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div class="table-foot">
          <span class="total-label">{{ kMeta.total }} kiosk</span>
          <div class="pagination" v-if="kMeta.totalPages > 1">
            <button :disabled="kPg.page <= 1" @click="kPg.page--; fetchKiosks()">← Trước</button>
            <span>{{ kPg.page }} / {{ kMeta.totalPages }}</span>
            <button :disabled="kPg.page >= kMeta.totalPages" @click="kPg.page++; fetchKiosks()">Tiếp →</button>
          </div>
        </div>
      </div>
    </template>

    <template v-if="activeTab === 'types'">
      <div class="info-note" style="margin-bottom:0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>Loại kiosk dùng chung cho toàn hệ thống, không phân theo tenant.</span>
      </div>
      <div class="table-panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tên loại</th>
                <th>Mô tả</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="tLoading"><td colspan="4"><div class="loading-bar"></div></td></tr>
              <template v-else>
                <tr v-for="t in kioskTypes" :key="t.type_id">
                  <td><span class="type-chip">{{ t.tenLoai }}</span></td>
                  <td class="cell-sub">{{ t.moTa || '—' }}</td>
                  <td class="cell-date">{{ fmtDate(t.created_at) }}</td>
                  <td>
                    <button class="icon-btn" title="Chỉnh sửa" @click="openEditType(t)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </td>
                </tr>
                <tr v-if="!kioskTypes.length">
                  <td colspan="4" class="empty-row">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/></svg>
                    <p>Chưa có loại kiosk nào</p>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div class="table-foot">
          <span class="total-label">{{ kioskTypes.length }} loại</span>
        </div>
      </div>
    </template>

    <template v-if="activeTab === 'assignments'">
      <div class="filter-bar">
        <select v-model="aFilters.trangThai" @change="fetchAssignments">
          <option value="active">Đang thuê</option>
          <option value="ended">Đã kết thúc</option>
          <option value="">Tất cả</option>
        </select>
        <button class="btn-outline" @click="resetAFilters">Reset</button>
      </div>
      <div class="table-panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tiểu thương</th>
                <th>Kiosk</th>
                <th>Khu / Chợ</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="aLoading"><td colspan="7"><div class="loading-bar"></div></td></tr>
              <template v-else>
                <tr v-for="a in assignments" :key="a.assignment_id">
                  <td>
                    <div class="cell-with-avatar">
                      <div class="m-avatar">{{ initials(a.merchantName) }}</div>
                      <div>
                        <div class="cell-main">{{ a.merchantName }}</div>
                        <div class="cell-sub">{{ a.soDienThoai }}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="kiosk-code">{{ a.maKiosk }}</span></td>
                  <td>
                    <div class="cell-stack">
                      <span class="cell-main">{{ a.tenKhu }}</span>
                      <span class="cell-sub">{{ a.tenCho }}</span>
                    </div>
                  </td>
                  <td class="cell-date">{{ fmtDate(a.ngayBatDau) }}</td>
                  <td class="cell-date">{{ a.ngayKetThuc ? fmtDate(a.ngayKetThuc) : '—' }}</td>
                  <td>
                    <span class="badge" :class="a.trangThai === 'active' ? 'badge--blue' : 'badge--gray'">
                      {{ a.trangThai === 'active' ? 'Đang thuê' : 'Đã kết thúc' }}
                    </span>
                  </td>
                  <td>
                    <button v-if="a.trangThai === 'active'" class="icon-btn icon-btn--danger" title="Kết thúc hợp đồng" @click="endAssignment(a)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    </button>
                    <span v-else class="cell-sub">—</span>
                  </td>
                </tr>
                <tr v-if="!assignments.length">
                  <td colspan="7" class="empty-row">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/></svg>
                    <p>Chưa có phân quầy nào</p>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div class="table-foot">
          <span class="total-label">{{ aMeta.total }} phân quầy</span>
          <div class="pagination" v-if="aMeta.totalPages > 1">
            <button :disabled="aPg.page <= 1" @click="aPg.page--; fetchAssignments()">← Trước</button>
            <span>{{ aPg.page }} / {{ aMeta.totalPages }}</span>
            <button :disabled="aPg.page >= aMeta.totalPages" @click="aPg.page++; fetchAssignments()">Tiếp →</button>
          </div>
        </div>
      </div>
    </template>

    <Teleport to="body">
      <div v-if="showKioskModal" class="modal-overlay" @click.self="showKioskModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ editingKiosk ? 'Cập nhật Kiosk' : 'Thêm Kiosk mới' }}</h3>
            <button class="modal-close" @click="showKioskModal = false"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="field">
                <label>Chợ <span class="req">*</span></label>
                <select v-model="kForm.market_id" @change="kForm.zone_id = ''">
                  <option value="">-- Chọn chợ --</option>
                  <option v-for="m in markets" :key="m.market_id" :value="m.market_id">{{ m.tenCho }}</option>
                </select>
              </div>
              <div class="field">
                <label>Khu <span class="req">*</span></label>
                <select v-model="kForm.zone_id">
                  <option value="">-- Chọn khu --</option>
                  <option v-for="z in zones.filter((z:any) => z.market_id == kForm.market_id)" :key="z.zone_id" :value="z.zone_id">{{ z.tenKhu }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Mã Kiosk <span class="req">*</span></label>
                <input v-model="kForm.maKiosk" placeholder="K01, A01..." />
              </div>
              <div class="field">
                <label>Loại Kiosk <span class="req">*</span></label>
                <select v-model="kForm.type_id">
                  <option value="">-- Chọn loại --</option>
                  <option v-for="t in kioskTypes" :key="t.type_id" :value="t.type_id">{{ t.tenLoai }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Vị trí</label>
                <input v-model="kForm.viTri" placeholder="Hàng A, cột 3" />
              </div>
              <div class="field">
                <label>Diện tích (m²)</label>
                <input v-model.number="kForm.dienTich" type="number" min="1" placeholder="10" />
              </div>
            </div>
            <div class="error-banner" v-if="kFormError">{{ kFormError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showKioskModal = false">Hủy</button>
            <button class="btn-primary" @click="submitKiosk" :disabled="saving">
              <span v-if="saving" class="spin"></span>
              {{ saving ? 'Đang lưu...' : (editingKiosk ? 'Cập nhật' : 'Thêm Kiosk') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="statusModal" class="modal-overlay" @click.self="statusModal = false">
        <div class="modal modal--sm">
          <div class="modal-header">
            <h3>Đổi trạng thái — {{ statusTarget?.maKiosk }}</h3>
            <button class="modal-close" @click="statusModal = false"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>Trạng thái mới</label>
              <select v-model="newStatus">
                <option value="available">Trống</option>
                <option value="maintenance">Bảo trì</option>
                <option value="locked">Khóa</option>
              </select>
            </div>
            <div class="info-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Trạng thái <strong>Đang thuê</strong> được tự động set khi phân quầy cho tiểu thương.</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="statusModal = false">Hủy</button>
            <button class="btn-primary" @click="submitStatus" :disabled="saving">
              <span v-if="saving" class="spin"></span>Xác nhận
            </button>
          </div>
        </div>
      </div>

      <div v-if="showTypeModal" class="modal-overlay" @click.self="showTypeModal = false">
        <div class="modal modal--sm">
          <div class="modal-header">
            <h3>{{ editingType ? 'Cập nhật Loại' : 'Thêm Loại Kiosk' }}</h3>
            <button class="modal-close" @click="showTypeModal = false"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>Tên loại <span class="req">*</span></label>
              <input v-model="tForm.tenLoai" placeholder="Sạp thực phẩm, Quầy may mặc..." />
            </div>
            <div class="field">
              <label>Mô tả</label>
              <input v-model="tForm.moTa" placeholder="Mô tả ngắn..." />
            </div>
            <div class="error-banner" v-if="tFormError">{{ tFormError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showTypeModal = false">Hủy</button>
            <button class="btn-primary" @click="submitType" :disabled="saving">
              <span v-if="saving" class="spin"></span>
              {{ saving ? 'Đang lưu...' : (editingType ? 'Cập nhật' : 'Thêm') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>Phân quầy cho Tiểu thương</h3>
            <button class="modal-close" @click="showAssignModal = false"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>Kiosk <span class="req">*</span></label>
              <select v-model="aForm.kiosk_id">
                <option value="">-- Chọn kiosk trống --</option>
                <option v-for="k in availableKiosks" :key="k.kiosk_id" :value="k.kiosk_id">
                  {{ k.maKiosk }} — {{ k.tenKhu }} ({{ k.tenCho }})
                </option>
              </select>
            </div>
            <div class="field">
              <label>Tiểu thương <span class="req">*</span></label>
              <div class="search-tenant-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input v-model="merchantSearch" placeholder="Tìm tên tiểu thương..." />
              </div>
              <div class="tenant-list-wrap">
                <div v-for="m in filteredMerchants" :key="m.merchant_id"
                  class="tenant-option" :class="{ 'tenant-option--selected': aForm.merchant_id === m.merchant_id }"
                  @click="aForm.merchant_id = m.merchant_id">
                  <div class="m-avatar sm">{{ initials(m.hoTen) }}</div>
                  <div class="to-info">
                    <div class="to-name">{{ m.hoTen }}</div>
                    <div class="to-phone">{{ m.soDienThoai }}</div>
                  </div>
                  <svg v-if="aForm.merchant_id === m.merchant_id" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3d8c3d" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div v-if="!filteredMerchants.length" class="tenant-msg">Không tìm thấy tiểu thương</div>
              </div>
            </div>
            <div class="field">
              <label>Ngày bắt đầu <span class="req">*</span></label>
              <input v-model="aForm.ngayBatDau" type="date" />
            </div>
            <div class="error-banner" v-if="aFormError">{{ aFormError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showAssignModal = false">Hủy</button>
            <button class="btn-primary" @click="submitAssign" :disabled="saving">
              <span v-if="saving" class="spin"></span>
              {{ saving ? 'Đang lưu...' : 'Xác nhận phân quầy' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'

const route = useRoute()
const saving = ref(false)
const activeTab = ref<'kiosks'|'types'|'assignments'>('kiosks')

const markets    = ref<any[]>([])
const zones      = ref<any[]>([])
const kioskTypes = ref<any[]>([])  
const merchants  = ref<any[]>([])
const quota      = ref({ used: 0, max: 0 })

const quotaPct = computed(() => quota.value.max ? Math.min(100, Math.round(quota.value.used / quota.value.max * 100)) : 0)

onMounted(async () => {
  await Promise.all([
    api.get('/market', { params: { limit: 200 } }).then(r => markets.value = r.data.data || []).catch(() => {}),
    api.get('/zone', { params: { limit: 500 } }).then(r => zones.value = r.data.data || []).catch(() => {}),
    api.get('/kioskType', { params: { limit: 100 } }).then(r => kioskTypes.value = r.data.data || []).catch(() => {}),
    api.get('/merchant', { params: { limit: 500, trangThai: 'active' } }).then(r => merchants.value = r.data.data || []).catch(() => {}),
    api.get('/plan_subscription').then(r => { if (r.data?.gioiHanSoKiosk) quota.value.max = r.data.gioiHanSoKiosk }).catch(() => {}),
  ])
  fetchKiosks()
})

function switchTab(tab: 'kiosks'|'types'|'assignments') {
  activeTab.value = tab
  if (tab === 'kiosks') fetchKiosks()
  else if (tab === 'types') fetchTypes()
  else fetchAssignments()
}

const kLoading = ref(true)
const kiosks   = ref<any[]>([])
const kMeta    = ref({ total: 0, totalPages: 1 })
const kPg      = reactive({ page: 1, limit: 10 })
const kFilters = reactive({
  q: route.query.q || '' as any,
  market_id: route.query.market_id || '' as any,
  zone_id: route.query.zone_id || '' as any,
  trangThai: ''
})
const showKioskModal = ref(false)
const editingKiosk   = ref<any>(null)
const statusModal    = ref(false)
const statusTarget   = ref<any>(null)
const newStatus      = ref('available')
const kFormError     = ref('')
const kForm = reactive({ maKiosk: '', zone_id: '' as any, market_id: '' as any, type_id: '' as any, viTri: '', dienTich: null as number|null })

const filteredZones   = computed(() => kFilters.market_id ? zones.value.filter((z:any) => z.market_id == kFilters.market_id) : zones.value)
const availableKiosks = computed(() => kiosks.value.filter(k => k.trangThai === 'available'))

let kDebounce: any
function debouncedK() { clearTimeout(kDebounce); kDebounce = setTimeout(() => { kPg.page = 1; fetchKiosks() }, 400) }

async function fetchKiosks() {
  kLoading.value = true
  try {
    const p: any = { page: kPg.page, limit: kPg.limit }
    if (kFilters.q)         p.q         = kFilters.q
    if (kFilters.market_id) p.market_id = kFilters.market_id
    if (kFilters.zone_id)   p.zone_id   = kFilters.zone_id
    if (kFilters.trangThai) p.trangThai = kFilters.trangThai
    const res = await api.get('/kiosk', { params: p })
    kiosks.value = res.data.data || []
    kMeta.value  = res.data.meta || { total: 0, totalPages: 1 }
    quota.value.used = kMeta.value.total
  } catch { kiosks.value = [] }
  finally { kLoading.value = false }
}

function onMarketChange() { kFilters.zone_id = ''; fetchKiosks() }
function resetKFilters() { kFilters.q = ''; kFilters.market_id = ''; kFilters.zone_id = ''; kFilters.trangThai = ''; kPg.page = 1; fetchKiosks() }

function openCreate() {
  if (activeTab.value === 'kiosks') { openCreateKiosk() }
  else if (activeTab.value === 'types') { openCreateType() }
  else { openAssignModal() }
}

function openCreateKiosk() {
  editingKiosk.value = null
  Object.assign(kForm, { maKiosk: '', zone_id: kFilters.zone_id || '', market_id: kFilters.market_id || '', type_id: '', viTri: '', dienTich: null })
  kFormError.value = ''; showKioskModal.value = true
}

function openEditKiosk(k: any) {
  editingKiosk.value = k
  const zone = zones.value.find((z:any) => z.zone_id === k.zone_id)
  Object.assign(kForm, { maKiosk: k.maKiosk, zone_id: k.zone_id, market_id: zone?.market_id || '', type_id: k.type_id, viTri: k.viTri || '', dienTich: k.dienTich || null })
  kFormError.value = ''; showKioskModal.value = true
}

function openStatusModal(k: any) {
  statusTarget.value = k
  newStatus.value = k.trangThai === 'occupied' ? 'available' : k.trangThai
  statusModal.value = true
}

function quickAssign(k: any) { aForm.kiosk_id = k.kiosk_id; openAssignModal() }

async function submitKiosk() {
  if (!kForm.maKiosk.trim() || !kForm.zone_id || !kForm.type_id) { kFormError.value = 'Vui lòng điền đầy đủ'; return }
  saving.value = true; kFormError.value = ''
  try {
    const payload = { maKiosk: kForm.maKiosk.trim(), zone_id: Number(kForm.zone_id), type_id: Number(kForm.type_id), viTri: kForm.viTri || null, dienTich: kForm.dienTich || null }
    if (editingKiosk.value) await api.put(`/kiosk/${editingKiosk.value.kiosk_id}`, payload)
    else await api.post('/kiosk', payload)
    showKioskModal.value = false; fetchKiosks()
  } catch (e: any) { kFormError.value = e.response?.data?.message || 'Lỗi khi lưu' }
  finally { saving.value = false }
}

async function submitStatus() {
  if (!statusTarget.value) return
  saving.value = true
  try {
    await api.patch(`/kiosk/${statusTarget.value.kiosk_id}/status`, { trangThai: newStatus.value })
    statusTarget.value.trangThai = newStatus.value; statusModal.value = false
  } catch (e: any) { alert(e.response?.data?.message || 'Lỗi') }
  finally { saving.value = false }
}

const tLoading   = ref(false)
const showTypeModal = ref(false)
const editingType   = ref<any>(null)
const tFormError    = ref('')
const tForm = reactive({ tenLoai: '', moTa: '' })

async function fetchTypes() {
  tLoading.value = true
  try {
    const res = await api.get('/kioskType', { params: { limit: 100 } })
    kioskTypes.value = res.data.data || []
  } catch {}
  finally { tLoading.value = false }
}

function openCreateType() {
  editingType.value = null; Object.assign(tForm, { tenLoai: '', moTa: '' }); tFormError.value = ''; showTypeModal.value = true
}
function openEditType(t: any) {
  editingType.value = t; Object.assign(tForm, { tenLoai: t.tenLoai, moTa: t.moTa || '' }); tFormError.value = ''; showTypeModal.value = true
}
async function submitType() {
  if (!tForm.tenLoai.trim()) { tFormError.value = 'Vui lòng nhập tên loại'; return }
  saving.value = true; tFormError.value = ''
  try {
    if (editingType.value) await api.put(`/kioskType/${editingType.value.type_id}`, tForm)
    else await api.post('/kioskType', tForm)
    showTypeModal.value = false; fetchTypes()
  } catch (e: any) { tFormError.value = e.response?.data?.message || 'Lỗi khi lưu' }
  finally { saving.value = false }
}

const aLoading = ref(false)
const assignments = ref<any[]>([])
const aMeta = ref({ total: 0, totalPages: 1 })
const aPg   = reactive({ page: 1, limit: 10 })
const aFilters = reactive({ trangThai: 'active' })
const showAssignModal = ref(false)
const aFormError = ref('')
const merchantSearch = ref('')
const aForm = reactive({ kiosk_id: '' as any, merchant_id: '' as any, ngayBatDau: new Date().toISOString().split('T')[0] })

const filteredMerchants = computed(() => {
  const q = merchantSearch.value.trim().toLowerCase()
  if (!q) return merchants.value
  return merchants.value.filter((m:any) => m.hoTen?.toLowerCase().includes(q) || m.soDienThoai?.includes(q))
})

async function fetchAssignments() {
  aLoading.value = true
  try {
    const p: any = { page: aPg.page, limit: aPg.limit }
    if (aFilters.trangThai) p.trangThai = aFilters.trangThai
    const res = await api.get('/kioskAssignment', { params: p })
    assignments.value = res.data.data || []
    aMeta.value = res.data.meta || { total: 0, totalPages: 1 }
  } catch { assignments.value = [] }
  finally { aLoading.value = false }
}

function resetAFilters() { aFilters.trangThai = 'active'; aPg.page = 1; fetchAssignments() }

function openAssignModal() {
  if (!aForm.kiosk_id) aForm.kiosk_id = ''
  aForm.merchant_id = ''
  aForm.ngayBatDau  = new Date().toISOString().split('T')[0]
  merchantSearch.value = ''; aFormError.value = ''; showAssignModal.value = true
}

async function submitAssign() {
  if (!aForm.kiosk_id || !aForm.merchant_id || !aForm.ngayBatDau) { aFormError.value = 'Vui lòng điền đầy đủ'; return }
  saving.value = true; aFormError.value = ''
  try {
    await api.post('/kioskAssignment', {
      kiosk_id:    Number(aForm.kiosk_id),
      merchant_id: Number(aForm.merchant_id),
      ngayBatDau:  aForm.ngayBatDau,
    })
    showAssignModal.value = false; fetchKiosks(); fetchAssignments()
    activeTab.value = 'assignments'
  } catch (e: any) { aFormError.value = e.response?.data?.message || 'Lỗi khi phân quầy' }
  finally { saving.value = false }
}

async function endAssignment(a: any) {
  if (!confirm(`Kết thúc hợp đồng của ${a.merchantName} tại kiosk ${a.maKiosk}?`)) return
  try {
    await api.patch(`/kioskAssignment/${a.assignment_id}/end`)
    fetchAssignments(); fetchKiosks()
  } catch (e: any) { alert(e.response?.data?.message || 'Lỗi') }
}

function kioskStatusClass(s: string) {
  return { available: 'badge--green', occupied: 'badge--blue', maintenance: 'badge--amber', locked: 'badge--red' }[s] || 'badge--gray'
}
function kioskStatusLabel(s: string) {
  return { available: 'Trống', occupied: 'Đang thuê', maintenance: 'Bảo trì', locked: 'Khóa' }[s] || s
}
function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('vi-VN') : '—' }
function initials(n: string) { return (n || '?').split(' ').map((w:string) => w[0]).slice(-2).join('').toUpperCase() }
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; }
.page { display: flex; flex-direction: column; gap: 18px; font-family: 'Be Vietnam Pro', sans-serif; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 22px; font-weight: 600; color: #1a2e1a; margin: 0 0 4px; }
.page-sub { font-size: 13px; color: #6b836b; margin: 0; }
.tabs { display: flex; gap: 4px; background: white; border: 1px solid #e2ede2; border-radius: 12px; padding: 4px; width: fit-content; }
.tab { display: flex; align-items: center; gap: 7px; height: 36px; padding: 0 16px; background: none; border: none; border-radius: 9px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #6b836b; cursor: pointer; transition: all .15s; white-space: nowrap; }
.tab:hover { background: #f0f7f0; color: #2d6e2d; }
.tab--active { background: #CCFF66; color: #1a3d00; font-weight: 600; }
.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { flex: 1; min-width: 160px; max-width: 240px; position: relative; display: flex; align-items: center; }
.search-wrap svg { position: absolute; left: 11px; color: #94a894; pointer-events: none; }
.search-wrap input { width: 100%; height: 38px; padding: 0 12px 0 33px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }
.search-wrap input:focus { border-color: #3d8c3d; }
select { height: 38px; padding: 0 10px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }
.quota-bar { background: white; border: 1px solid #e2ede2; border-radius: 12px; padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
.quota-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #4a654a; }
.quota-info strong { color: #1a2e1a; }
.quota-track { height: 6px; background: #f0f5f0; border-radius: 3px; overflow: hidden; }
.quota-fill { height: 100%; background: #3d8c3d; border-radius: 3px; transition: width 0.3s; }
.quota-fill--warn { background: #f97316; }
.info-note { display: flex; align-items: flex-start; gap: 8px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 13px; font-size: 12.5px; color: #1e40af; line-height: 1.55; }
.info-note svg { flex-shrink: 0; margin-top: 1px; }
.table-panel { background: white; border: 1px solid #e2ede2; border-radius: 14px; overflow: hidden; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 11px 14px; font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .06em; text-align: left; background: #fafcfa; border-bottom: 1px solid #f0f5f0; white-space: nowrap; }
.data-table td { padding: 13px 14px; border-bottom: 1px solid #f7faf7; vertical-align: middle; }
.data-table tbody tr:hover td { background: #fafcfa; }
.data-table tbody tr:last-child td { border-bottom: none; }
.kiosk-code { font-size: 13px; font-weight: 600; color: #1a2e1a; background: #f0f5f0; padding: 3px 8px; border-radius: 6px; font-family: monospace; }
.cell-stack { display: flex; flex-direction: column; gap: 2px; }
.cell-main { font-size: 13.5px; font-weight: 500; color: #1a2e1a; }
.cell-sub { font-size: 12px; color: #6b836b; }
.cell-date { font-size: 12.5px; color: #6b836b; white-space: nowrap; }
.cell-with-avatar { display: flex; align-items: center; gap: 9px; }
.m-avatar { width: 30px; height: 30px; background: #7c3aed; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: white; flex-shrink: 0; }
.m-avatar.sm { width: 28px; height: 28px; }
.type-chip { display: inline-flex; background: #eff6ff; color: #1d4ed8; padding: 3px 8px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
.badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
.badge--green { background: #eef7ee; color: #2d6e2d; }
.badge--blue  { background: #eff6ff; color: #1d4ed8; }
.badge--amber { background: #fffbeb; color: #b45309; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--gray  { background: #f4f4f4; color: #6b7280; }
.action-btns { display: flex; gap: 5px; }
.icon-btn { width: 30px; height: 30px; background: none; border: 1px solid #e2ede2; border-radius: 7px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #4a654a; transition: all .15s; }
.icon-btn:hover { background: #f0f7f0; }
.icon-btn--danger { color: #dc2626; border-color: #fecaca; }
.icon-btn--danger:hover { background: #fef2f2; }
.icon-btn--blue { color: #1d4ed8; border-color: #bfdbfe; }
.icon-btn--blue:hover { background: #eff6ff; }
.empty-row { text-align: center; padding: 48px 16px !important; color: #94a894; }
.empty-row p { margin: 8px 0 0; font-size: 13px; }
.loading-bar { height: 3px; background: linear-gradient(90deg,#eef7ee,#3d8c3d,#eef7ee); background-size: 200%; animation: shimmer 1.5s infinite; }
@keyframes shimmer { to { background-position: -200% center; } }
.table-foot { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid #f0f5f0; }
.total-label { font-size: 12.5px; color: #94a894; }
.pagination { display: flex; align-items: center; gap: 10px; }
.pagination button { height: 32px; padding: 0 14px; background: white; border: 1px solid #e2ede2; border-radius: 8px; cursor: pointer; font-size: 12.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #4a654a; }
.pagination button:hover:not(:disabled) { background: #f0f7f0; }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination span { font-size: 12.5px; color: #6b836b; }
.btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 18px; background: #3d8c3d; border: none; border-radius: 10px; color: white; font-size: 13.5px; font-weight: 500; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; transition: background .15s; }
.btn-primary:hover:not(:disabled) { background: #2d6e2d; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-ghost { height: 40px; padding: 0 18px; background: none; border: 1px solid #e2ede2; border-radius: 10px; color: #4a654a; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; }
.btn-ghost:hover { background: #f7faf7; }
.btn-outline { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; background: white; border: 1.5px solid #d4e4d4; border-radius: 10px; color: #4a654a; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; }
.btn-outline:hover { background: #f0f7f0; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal--sm { max-width: 380px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px 14px; border-bottom: 1px solid #f0f5f0; }
.modal-header h3 { font-size: 15px; font-weight: 600; color: #1a2e1a; margin: 0; }
.modal-close { background: none; border: none; color: #94a894; cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 6px; }
.modal-close:hover { background: #f0f5f0; }
.modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px; border-top: 1px solid #f0f5f0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 12.5px; font-weight: 500; color: #3a4f3a; }
.req { color: #dc2626; }
.field input, .field select { width: 100%; height: 40px; padding: 0 12px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: #fbfdfb; outline: none; }
.field input:focus, .field select:focus { border-color: #3d8c3d; background: white; }
.field input:disabled { background: #f5f8f5; color: #94a894; cursor: not-allowed; }
.error-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: 9px; padding: 10px 14px; color: #b91c1c; font-size: 13px; }
.search-tenant-wrap { position: relative; display: flex; align-items: center; }
.search-tenant-wrap svg { position: absolute; left: 11px; color: #94a894; pointer-events: none; }
.search-tenant-wrap input { width: 100%; height: 38px; padding: 0 12px 0 33px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }
.search-tenant-wrap input:focus { border-color: #3d8c3d; }
.tenant-list-wrap { border: 1px solid #e2ede2; border-radius: 10px; max-height: 180px; overflow-y: auto; background: white; }
.tenant-option { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f7faf7; transition: background .15s; }
.tenant-option:last-child { border-bottom: none; }
.tenant-option:hover { background: #fafcfa; }
.tenant-option--selected { background: #f0f7f0; }
.to-info { flex: 1; min-width: 0; }
.to-name { font-size: 13px; font-weight: 500; color: #1a2e1a; }
.to-phone { font-size: 11.5px; color: #94a894; }
.tenant-msg { padding: 18px; text-align: center; font-size: 13px; color: #94a894; }
.spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.35); border-top-color: white; border-radius: 50%; animation: spin .65s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>