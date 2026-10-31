import {
  getRooms,
  addRoom,
  updateRoom,
  deleteRoom,
  getTenants,
  addTenant,
  updateTenant,
  deleteTenant,
  toggleTenantPaymentStatus,
  getFinances,
  addFinance,
  deleteFinance,
  getFinancialSummary,
  getBookings,
  updateBookingStatus,
  deleteBooking,
  resetToDemoData,
  formatRupiah,
  escapeHtml,
} from '../lib/storage.js';
import { toast } from './toast.js';
import { isOwnerLoggedIn } from './auth.js';
import { renderPublicRooms } from './rooms.js';

let editingRoomId = null;
let editingTenantId = null;
let currentBookingFilter = 'all';
let currentFinanceFilter = 'all';

/**
 * Inisialisasi dan refresh seluruh data di Dashboard Pemilik
 */
export function loadOwnerDashboard() {
  if (!isOwnerLoggedIn()) {
    toast.error('Silakan login terlebih dahulu untuk mengakses dashboard.');
    return;
  }

  updateDashboardStats();
  loadOwnerTenants();
  loadOwnerFinances();
  loadOwnerRooms();
  loadOwnerBookings();
  populateRoomOptionsForTenant();
}

/**
 * ============================================================================
 * 1. RINGKASAN KEUANGAN & STATISTIK
 * ============================================================================
 */
export function updateDashboardStats() {
  const summary = getFinancialSummary();
  const rooms = getRooms();
  const bookings = getBookings();

  // Metrics Keuangan & Penghuni
  const elTenants = document.getElementById('stat-total-tenants');
  const elIncome = document.getElementById('stat-total-income');
  const elExpense = document.getElementById('stat-total-expense');
  const elBalance = document.getElementById('stat-net-balance');

  if (elTenants) elTenants.textContent = `${summary.totalTenants} Orang`;
  if (elIncome) elIncome.textContent = formatRupiah(summary.totalIncome);
  if (elExpense) elExpense.textContent = formatRupiah(summary.totalExpense);
  if (elBalance) {
    elBalance.textContent = formatRupiah(summary.netBalance);
    if (summary.netBalance >= 0) {
      elBalance.style.color = '#2e7d32';
    } else {
      elBalance.style.color = '#c62828';
    }
  }

  // Secondary metrics
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.status === 'available').length;
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;

  const elTotalRooms = document.getElementById('stat-total-rooms');
  const elAvailRooms = document.getElementById('stat-available-rooms');
  const elOccupiedRooms = document.getElementById('stat-occupied-rooms');
  const elPendingBookings = document.getElementById('stat-pending-bookings');

  if (elTotalRooms) elTotalRooms.textContent = totalRooms;
  if (elAvailRooms) elAvailRooms.textContent = availableRooms;
  if (elOccupiedRooms) elOccupiedRooms.textContent = occupiedRooms;
  if (elPendingBookings) {
    elPendingBookings.textContent = pendingBookings;
    if (pendingBookings > 0) {
      elPendingBookings.classList.add('pulse-alert');
    } else {
      elPendingBookings.classList.remove('pulse-alert');
    }
  }
}

/**
 * ============================================================================
 * 2. KELOLA PENGHUNI (TENANTS)
 * ============================================================================
 */
export function loadOwnerTenants() {
  const container = document.getElementById('owner-tenants-list');
  if (!container) return;

  const tenants = getTenants();

  if (!tenants || tenants.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 empty-table">
          <p>Belum ada data penghuni kos.</p>
          <button class="btn btn-sm btn-primary" onclick="window.openAddTenantModal()">+ Tambah Penghuni Pertama</button>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = '';

  tenants.forEach((t, idx) => {
    const tr = document.createElement('tr');

    // Link WhatsApp
    const cleanPhone = (t.phone || '').replace(/\D/g, '');
    const waNumber = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const waText = encodeURIComponent(`Halo Kak ${t.full_name}, kami dari pengelola KostPutriWinda.`);
    const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : '#';

    // Status Bayar Pill
    const isPaid = t.payment_status === 'paid';
    const statusPillClass = isPaid ? 'status-badge-confirmed' : 'status-badge-pending';
    const statusPillText = isPaid ? '✓ Lunas' : '⏳ Belum Bayar';

    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>
        <strong>${escapeHtml(t.full_name)}</strong>
        ${t.notes ? `<div class="table-desc" style="font-size: 0.775rem;">${escapeHtml(t.notes)}</div>` : ''}
      </td>
      <td><span class="badge-room">${escapeHtml(t.room_name || '-')}</span></td>
      <td>
        ${
          waNumber
            ? `<a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="wa-table-btn" title="Chat WhatsApp Penghuni">💬 ${escapeHtml(t.phone)}</a>`
            : escapeHtml(t.phone || '-')
        }
      </td>
      <td>${escapeHtml(t.check_in_date || '-')}</td>
      <td><strong>${formatRupiah(t.monthly_rent || 0)}</strong></td>
      <td>
        <button type="button" class="btn-toggle-status ${statusPillClass}" onclick="window.quickTogglePayment('${t.id}')" title="Klik untuk mengubah status pembayaran">
          ${statusPillText}
        </button>
      </td>
      <td class="table-actions">
        <button class="btn-icon btn-edit" title="Edit Penghuni" onclick="window.openEditTenantModal('${t.id}')">✏️</button>
        <button class="btn-icon btn-delete" title="Hapus Penghuni" onclick="window.confirmDeleteTenant('${t.id}', '${escapeHtml(t.full_name)}')">🗑️</button>
      </td>
    `;

    container.appendChild(tr);
  });
}

export function quickTogglePayment(tenantId) {
  const updated = toggleTenantPaymentStatus(tenantId);
  if (updated) {
    const label = updated.payment_status === 'paid' ? 'LUNAS (Pemasukan dicatat otomatis)' : 'BELUM BAYAR';
    toast.success(`Status pembayaran ${updated.full_name} diubah menjadi: ${label}`);
    loadOwnerTenants();
    loadOwnerFinances();
    updateDashboardStats();
  }
}

export function openAddTenantModal() {
  editingTenantId = null;
  const modal = document.getElementById('tenant-modal');
  const title = document.getElementById('tenant-modal-title');
  const form = document.getElementById('tenant-form');

  if (title) title.textContent = 'Tambah Penghuni Baru';
  if (form) form.reset();

  const idInput = document.getElementById('tenant-form-id');
  if (idInput) idInput.value = '';

  const dateInput = document.getElementById('tenant-form-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  populateRoomOptionsForTenant();

  if (modal) {
    modal.classList.add('modal-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
}

export function openEditTenantModal(tenantId) {
  const tenants = getTenants();
  const t = tenants.find((item) => item.id === tenantId);
  if (!t) return;

  editingTenantId = tenantId;
  const modal = document.getElementById('tenant-modal');
  const title = document.getElementById('tenant-modal-title');

  if (title) title.textContent = `Edit Data Penghuni: ${t.full_name}`;

  document.getElementById('tenant-form-id').value = t.id;
  document.getElementById('tenant-form-name').value = t.full_name;
  document.getElementById('tenant-form-phone').value = t.phone || '';
  document.getElementById('tenant-form-date').value = t.check_in_date || '';
  document.getElementById('tenant-form-rent').value = t.monthly_rent || '';
  document.getElementById('tenant-form-status').value = t.payment_status || 'paid';
  document.getElementById('tenant-form-notes').value = t.notes || '';

  populateRoomOptionsForTenant(t.room_id);

  if (modal) {
    modal.classList.add('modal-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
}

export function closeTenantModal() {
  const modal = document.getElementById('tenant-modal');
  if (modal) {
    modal.classList.remove('modal-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
  editingTenantId = null;
}

export function populateRoomOptionsForTenant(selectedRoomId = null) {
  const select = document.getElementById('tenant-form-room');
  if (!select) return;

  const rooms = getRooms();
  select.innerHTML = '<option value="">-- Pilih Kamar Kos --</option>';

  rooms.forEach((r) => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `${r.name} (${formatRupiah(r.price_per_month)}/bln - ${r.status === 'available' ? 'Tersedia' : 'Terisi'})`;
    opt.setAttribute('data-name', r.name);
    opt.setAttribute('data-price', r.price_per_month);
    if (selectedRoomId && r.id === selectedRoomId) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });

  // Saat kamar dipilih, otomatis isi harga sewa bulanan
  select.onchange = () => {
    const selectedOption = select.options[select.selectedIndex];
    const price = selectedOption.getAttribute('data-price');
    const rentInput = document.getElementById('tenant-form-rent');
    if (price && rentInput && !rentInput.value) {
      rentInput.value = price;
    }
  };
}

export function handleTenantFormSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('tenant-form-name').value.trim();
  const phone = document.getElementById('tenant-form-phone').value.trim();
  const roomSelect = document.getElementById('tenant-form-room');
  const roomId = roomSelect ? roomSelect.value : '';
  const selectedOption = roomSelect ? roomSelect.options[roomSelect.selectedIndex] : null;
  const roomName = selectedOption && selectedOption.value ? selectedOption.getAttribute('data-name') : 'Kamar Kos';
  const checkInDate = document.getElementById('tenant-form-date').value;
  const rent = Number(document.getElementById('tenant-form-rent').value) || 0;
  const paymentStatus = document.getElementById('tenant-form-status').value;
  const notes = document.getElementById('tenant-form-notes').value.trim();

  if (!name) {
    toast.error('Nama lengkap penghuni wajib diisi.');
    return;
  }

  const payload = {
    full_name: name,
    phone,
    room_id: roomId,
    room_name: roomName,
    check_in_date: checkInDate,
    monthly_rent: rent,
    payment_status: paymentStatus,
    notes,
  };

  if (editingTenantId) {
    updateTenant(editingTenantId, payload);
    toast.success('Data penghuni berhasil diperbarui!');
  } else {
    addTenant(payload);
    toast.success('Penghuni baru berhasil ditambahkan!');
  }

  closeTenantModal();
  loadOwnerTenants();
  loadOwnerRooms();
  loadOwnerFinances();
  updateDashboardStats();
  renderPublicRooms();
}

export function confirmDeleteTenant(id, name) {
  const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus penghuni "${name}"? Kamar yang ditempati akan otomatis kembali menjadi Tersedia.`);
  if (!confirmed) return;

  deleteTenant(id);
  toast.success(`Data penghuni "${name}" berhasil dihapus.`);
  loadOwnerTenants();
  loadOwnerRooms();
  updateDashboardStats();
  renderPublicRooms();
}

/**
 * ============================================================================
 * 3. CATATAN KEUANGAN (FINANCES: PEMASUKAN & PENGELUARAN)
 * ============================================================================
 */
export function loadOwnerFinances() {
  const container = document.getElementById('owner-finances-list');
  if (!container) return;

  const finances = getFinances();

  let filtered = finances;
  if (currentFinanceFilter !== 'all') {
    filtered = finances.filter((f) => f.type === currentFinanceFilter);
  }

  if (!filtered || filtered.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 empty-table">
          <p>Belum ada catatan transaksi ${currentFinanceFilter !== 'all' ? `kategori ${currentFinanceFilter}` : ''}.</p>
          <button class="btn btn-sm btn-primary" onclick="window.openAddFinanceModal('income')">+ Catat Transaksi Baru</button>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = '';

  filtered.forEach((item, idx) => {
    const tr = document.createElement('tr');
    const isIncome = item.type === 'income';

    const typeBadge = isIncome
      ? '<span class="status-badge-confirmed" style="background:#e8f5e9; color:#1b5e20;">+ Pemasukan</span>'
      : '<span class="status-badge-cancelled" style="background:#ffebee; color:#c62828;">- Pengeluaran</span>';

    const amountFormatted = isIncome
      ? `<strong style="color: #2e7d32;">+ ${formatRupiah(item.amount)}</strong>`
      : `<strong style="color: #c62828;">- ${formatRupiah(item.amount)}</strong>`;

    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${escapeHtml(item.date)}</td>
      <td>${typeBadge}</td>
      <td><span class="badge-category">${escapeHtml(item.category || '-')}</span></td>
      <td><div class="table-desc" title="${escapeHtml(item.description)}">${escapeHtml(item.description)}</div></td>
      <td>${amountFormatted}</td>
      <td class="table-actions">
        <button class="btn-icon btn-delete" title="Hapus Catatan" onclick="window.confirmDeleteFinance('${item.id}')">🗑️</button>
      </td>
    `;

    container.appendChild(tr);
  });
}

export function openAddFinanceModal(defaultType = 'income') {
  const modal = document.getElementById('finance-modal');
  const form = document.getElementById('finance-form');
  if (form) form.reset();

  const typeSelect = document.getElementById('finance-form-type');
  if (typeSelect) {
    typeSelect.value = defaultType;
    updateFinanceCategoryOptions(defaultType);
  }

  const dateInput = document.getElementById('finance-form-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  if (modal) {
    modal.classList.add('modal-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
}

export function closeFinanceModal() {
  const modal = document.getElementById('finance-modal');
  if (modal) {
    modal.classList.remove('modal-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
}

export function updateFinanceCategoryOptions(type) {
  const select = document.getElementById('finance-form-category');
  if (!select) return;

  select.innerHTML = '';
  if (type === 'income') {
    const incomeCats = ['Sewa Kamar', 'Uang Muka / DP', 'Denda Keterlambatan', 'Listrik Tambahan', 'Lain-lain (Pemasukan)'];
    incomeCats.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      select.appendChild(opt);
    });
  } else {
    const expenseCats = [
      'Listrik & Token',
      'Internet Wi-Fi',
      'Air PDAM & Pompa',
      'Kebersihan & Sampah',
      'Perbaikan & Renovasi',
      'Perlengkapan Bersama',
      'Lain-lain (Pengeluaran)',
    ];
    expenseCats.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      select.appendChild(opt);
    });
  }
}

export function handleFinanceFormSubmit(event) {
  event.preventDefault();

  const type = document.getElementById('finance-form-type').value;
  const category = document.getElementById('finance-form-category').value;
  const amount = Number(document.getElementById('finance-form-amount').value);
  const date = document.getElementById('finance-form-date').value;
  const description = document.getElementById('finance-form-desc').value.trim();

  if (!amount || amount <= 0) {
    toast.error('Nominal transaksi harus berupa angka lebih dari 0.');
    return;
  }

  addFinance({
    type,
    category,
    amount,
    date,
    description,
  });

  toast.success(`Transaksi ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} berhasil dicatat!`);
  closeFinanceModal();
  loadOwnerFinances();
  updateDashboardStats();
}

export function confirmDeleteFinance(id) {
  const confirmed = window.confirm('Apakah Anda yakin ingin menghapus catatan transaksi ini?');
  if (!confirmed) return;

  deleteFinance(id);
  toast.success('Catatan transaksi berhasil dihapus.');
  loadOwnerFinances();
  updateDashboardStats();
}

export function setFinanceFilter(filter) {
  currentFinanceFilter = filter;
  document.querySelectorAll('.finance-filter-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-type') === filter);
  });
  loadOwnerFinances();
}

/**
 * ============================================================================
 * 4. PENGELOLAAN KAMAR (ROOMS)
 * ============================================================================
 */
export function loadOwnerRooms() {
  const container = document.getElementById('owner-rooms-list');
  if (!container) return;

  const rooms = getRooms();

  if (!rooms || rooms.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 empty-table">
          <p>Belum ada kamar yang ditambahkan.</p>
          <button class="btn btn-sm btn-primary" onclick="window.openAddRoomModal()">+ Tambah Kamar Pertama</button>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = '';

  rooms.forEach((room, idx) => {
    const tr = document.createElement('tr');
    const statusClass = `status-${room.status}`;

    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>
        <strong>${escapeHtml(room.name)}</strong>
        ${room.image_url ? `<br><a href="${escapeHtml(room.image_url)}" target="_blank" class="table-link">Lihat Foto</a>` : ''}
      </td>
      <td><strong>${formatRupiah(room.price_per_month)}</strong></td>
      <td><div class="table-desc" title="${escapeHtml(room.description)}">${escapeHtml(room.description)}</div></td>
      <td>
        <select class="status-select ${statusClass}" onchange="window.updateRoomStatusQuick('${room.id}', this.value)">
          <option value="available" ${room.status === 'available' ? 'selected' : ''}>Tersedia</option>
          <option value="occupied" ${room.status === 'occupied' ? 'selected' : ''}>Terisi</option>
          <option value="maintenance" ${room.status === 'maintenance' ? 'selected' : ''}>Perbaikan</option>
        </select>
      </td>
      <td class="table-actions">
        <button class="btn-icon btn-edit" title="Edit Kamar" onclick="window.openEditRoomModal('${room.id}')">✏️</button>
        <button class="btn-icon btn-delete" title="Hapus Kamar" onclick="window.confirmDeleteRoom('${room.id}', '${escapeHtml(room.name)}')">🗑️</button>
      </td>
    `;

    container.appendChild(tr);
  });
}

export function updateRoomStatusQuick(roomId, newStatus) {
  updateRoom(roomId, { status: newStatus });
  toast.success(`Status kamar berhasil diubah menjadi ${newStatus}`);
  loadOwnerRooms();
  updateDashboardStats();
  renderPublicRooms();
}

export function openAddRoomModal() {
  editingRoomId = null;
  const modal = document.getElementById('room-modal');
  const title = document.getElementById('room-modal-title');
  const form = document.getElementById('room-form');

  if (title) title.textContent = 'Tambah Kamar Baru';
  if (form) form.reset();

  const idInput = document.getElementById('room-form-id');
  if (idInput) idInput.value = '';

  if (modal) {
    modal.classList.add('modal-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
}

export function openEditRoomModal(roomId) {
  const rooms = getRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return;

  editingRoomId = roomId;
  const modal = document.getElementById('room-modal');
  const title = document.getElementById('room-modal-title');

  if (title) title.textContent = `Edit Kamar: ${room.name}`;

  document.getElementById('room-form-id').value = room.id;
  document.getElementById('room-form-name').value = room.name;
  document.getElementById('room-form-price').value = room.price_per_month;
  document.getElementById('room-form-desc').value = room.description;
  document.getElementById('room-form-status').value = room.status;
  document.getElementById('room-form-image').value = room.image_url || '';

  if (modal) {
    modal.classList.add('modal-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
}

export function closeRoomModal() {
  const modal = document.getElementById('room-modal');
  if (modal) {
    modal.classList.remove('modal-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
  editingRoomId = null;
}

export function handleRoomFormSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('room-form-name').value.trim();
  const price = Number(document.getElementById('room-form-price').value);
  const desc = document.getElementById('room-form-desc').value.trim();
  const status = document.getElementById('room-form-status').value;
  const imageUrl = document.getElementById('room-form-image').value.trim();

  if (!name) {
    toast.error('Nama kamar wajib diisi.');
    return;
  }

  const payload = {
    name,
    price_per_month: price,
    description: desc,
    status,
    image_url: imageUrl || '',
  };

  if (editingRoomId) {
    updateRoom(editingRoomId, payload);
    toast.success('Data kamar berhasil diperbarui!');
  } else {
    addRoom(payload);
    toast.success('Kamar baru berhasil ditambahkan!');
  }

  closeRoomModal();
  loadOwnerRooms();
  updateDashboardStats();
  renderPublicRooms();
  populateRoomOptionsForTenant();
}

export function confirmDeleteRoom(roomId, roomName) {
  const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus kamar "${roomName}"?`);
  if (!confirmed) return;

  deleteRoom(roomId);
  toast.success(`Kamar "${roomName}" berhasil dihapus.`);
  loadOwnerRooms();
  updateDashboardStats();
  renderPublicRooms();
  populateRoomOptionsForTenant();
}

/**
 * ============================================================================
 * 5. MANAJEMEN PEMESANAN (BOOKINGS DARI CALON PENYEWA)
 * ============================================================================
 */
export function loadOwnerBookings() {
  const container = document.getElementById('owner-bookings-list');
  if (!container) return;

  const bookings = getBookings();

  let filtered = bookings;
  if (currentBookingFilter !== 'all') {
    filtered = bookings.filter((b) => b.status === currentBookingFilter);
  }

  if (!filtered || filtered.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 empty-table">
          <p>Tidak ada pengajuan pemesanan ${currentBookingFilter !== 'all' ? `berstatus "${currentBookingFilter}"` : ''}.</p>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = '';

  filtered.forEach((item, idx) => {
    const tr = document.createElement('tr');
    const roomName = item.room_name || 'Kamar Kos';

    // Link WA calon penyewa
    const cleanPhone = (item.whatsapp_number || '').replace(/\D/g, '');
    const waNumber = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const waText = encodeURIComponent(
      `Halo Kak ${item.full_name}, kami dari pengelola KostPutriWinda mengenai pengajuan sewa ${roomName}.`
    );
    const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : '#';

    const statusLabels = {
      pending: '⏳ Menunggu',
      confirmed: '✓ Dikonfirmasi',
      cancelled: '✕ Dibatalkan',
    };

    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>
        <strong>${escapeHtml(item.full_name)}</strong>
        <div class="booking-time">${new Date(item.created_at).toLocaleDateString('id-ID')}</div>
      </td>
      <td>
        ${
          waNumber
            ? `<a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="wa-table-btn" title="Chat WhatsApp Pemohon">💬 ${escapeHtml(item.whatsapp_number)}</a>`
            : escapeHtml(item.whatsapp_number || '-')
        }
      </td>
      <td><strong>${escapeHtml(roomName)}</strong></td>
      <td>${escapeHtml(item.check_in_date)}</td>
      <td><div class="table-desc" title="${escapeHtml(item.notes || '-')}">${escapeHtml(item.notes || '-')}</div></td>
      <td>
        <span class="status-badge status-badge-${item.status}">
          ${statusLabels[item.status] || item.status}
        </span>
        <div class="booking-quick-actions">
          ${
            item.status !== 'confirmed'
              ? `<button class="btn btn-xs btn-success" onclick="window.updateBookingStatusAction('${item.id}', 'confirmed')">Konfirmasi</button>`
              : ''
          }
          ${
            item.status !== 'cancelled'
              ? `<button class="btn btn-xs btn-danger" onclick="window.updateBookingStatusAction('${item.id}', 'cancelled')">Batalkan</button>`
              : ''
          }
          <button class="btn btn-xs btn-secondary" onclick="window.convertBookingToTenant('${item.id}')" title="Jadikan Penghuni">+ Penghuni</button>
        </div>
      </td>
    `;

    container.appendChild(tr);
  });
}

export function updateBookingStatusAction(bookingId, newStatus) {
  updateBookingStatus(bookingId, newStatus);
  const label = newStatus === 'confirmed' ? 'Dikonfirmasi' : 'Dibatalkan';
  toast.success(`Status pemesanan berhasil diubah menjadi ${label}`);
  loadOwnerBookings();
  updateDashboardStats();
}

export function convertBookingToTenant(bookingId) {
  const bookings = getBookings();
  const b = bookings.find((item) => item.id === bookingId);
  if (!b) return;

  openAddTenantModal();
  document.getElementById('tenant-form-name').value = b.full_name;
  document.getElementById('tenant-form-phone').value = b.whatsapp_number;
  document.getElementById('tenant-form-date').value = b.check_in_date;
  document.getElementById('tenant-form-notes').value = `Konversi dari pemesanan web: ${b.notes || ''}`;

  if (b.room_id) {
    populateRoomOptionsForTenant(b.room_id);
  }

  // Tandai booking sebagai confirmed
  updateBookingStatus(bookingId, 'confirmed');
  toast.info(`Formulir penghuni telah diisi dari pemesanan ${b.full_name}. Silakan periksa dan simpan.`);
}

export function setOwnerBookingFilter(status) {
  currentBookingFilter = status;
  document.querySelectorAll('.booking-filter-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-status') === status);
  });
  loadOwnerBookings();
}

/**
 * ============================================================================
 * 6. RESET DATA KE DEMO BAWAAN
 * ============================================================================
 */
export function handleResetDemoData() {
  const confirmed = window.confirm('Apakah Anda ingin mereset seluruh data kembali ke Data Demo Bawaan? Seluruh perubahan lokal akan dikembalikan ke kondisi awal.');
  if (!confirmed) return;

  resetToDemoData();
  toast.success('Data aplikasi berhasil direset ke Demo Bawaan!');
  loadOwnerDashboard();
  renderPublicRooms();
}
