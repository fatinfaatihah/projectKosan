/**
 * STORAGE ENGINE KOSTPUTRIWINDA
 * Sistem penyimpanan data 100% berbasis Browser LocalStorage.
 * Berjalan sepenuhnya offline, tanpa ketergantungan Supabase, backend, atau API key.
 */

const STORAGE_KEYS = {
  ROOMS: 'kost_rooms_data',
  TENANTS: 'kost_tenants_data',
  FINANCES: 'kost_finances_data',
  BOOKINGS: 'kost_bookings_data',
  AUTH: 'kost_owner_auth',
  WHATSAPP: 'kost_owner_whatsapp',
};

// Data Awal Bawaan (Default Seed Data) agar website langsung hidup dan berisi saat pertama dibuka
const DEFAULT_ROOMS = [
  {
    id: 'room-1',
    name: 'Kamar Melati A-01',
    price_per_month: 1250000,
    description: 'Kamar mandi dalam, kasur springbed, lemari pakaian 2 pintu, meja belajar & kursi, jendela ventilasi luar, stopkontak ganda.',
    status: 'occupied',
    image_url: '',
    created_at: '2026-08-01T08:00:00Z',
  },
  {
    id: 'room-2',
    name: 'Kamar Anggrek A-02',
    price_per_month: 1350000,
    description: 'AC split dingin, kamar mandi dalam dengan shower, kasur springbed queen, meja rias & meja belajar, lemari besar.',
    status: 'available',
    image_url: '',
    created_at: '2026-08-02T09:00:00Z',
  },
  {
    id: 'room-3',
    name: 'Kamar Mawar B-01',
    price_per_month: 950000,
    description: 'Kipas angin plafon sejuk, kasur single springbed, meja belajar, lemari pakaian, dekat dapur bersama & kamar mandi luar bersih.',
    status: 'occupied',
    image_url: '',
    created_at: '2026-08-03T10:00:00Z',
  },
  {
    id: 'room-4',
    name: 'Kamar Cempaka B-02',
    price_per_month: 1100000,
    description: 'Kamar mandi dalam, kasur busa tebal & empuk, rak buku, lemari 2 pintu, pencahayaan alami sangat baik.',
    status: 'available',
    image_url: '',
    created_at: '2026-08-04T11:00:00Z',
  },
  {
    id: 'room-5',
    name: 'Kamar Dahlia B-03',
    price_per_month: 1200000,
    description: 'AC 1/2 PK hemat daya, kasur springbed, lemari pakaian, meja belajar modern, kamar mandi dalam.',
    status: 'maintenance',
    image_url: '',
    created_at: '2026-08-05T12:00:00Z',
  },
];

const DEFAULT_TENANTS = [
  {
    id: 'tenant-1',
    full_name: 'Siti Rahmawati',
    room_id: 'room-1',
    room_name: 'Kamar Melati A-01',
    phone: '081234567891',
    check_in_date: '2026-08-01',
    monthly_rent: 1250000,
    payment_status: 'paid', // 'paid' (Lunas) | 'unpaid' (Belum Bayar)
    notes: 'Mahasiswi Kedokteran semester 4. Membawa 1 motor Vario.',
    created_at: '2026-08-01T08:30:00Z',
  },
  {
    id: 'tenant-2',
    full_name: 'Annisa Putri Lestari',
    room_id: 'room-3',
    room_name: 'Kamar Mawar B-01',
    phone: '081987654321',
    check_in_date: '2026-09-15',
    monthly_rent: 950000,
    payment_status: 'unpaid',
    notes: 'Karyawati bank swasta. Bayar setiap tanggal 15.',
    created_at: '2026-09-15T09:00:00Z',
  },
];

const DEFAULT_FINANCES = [
  {
    id: 'fin-1',
    type: 'income',
    category: 'Sewa Kamar',
    amount: 1250000,
    date: '2026-10-01',
    description: 'Pembayaran sewa bulan Oktober - Siti Rahmawati (Melati A-01)',
    created_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 'fin-2',
    type: 'income',
    category: 'Sewa Kamar',
    amount: 950000,
    date: '2026-10-15',
    description: 'Pembayaran sewa bulan Oktober - Annisa Putri (Mawar B-01)',
    created_at: '2026-10-15T11:00:00Z',
  },
  {
    id: 'fin-3',
    type: 'expense',
    category: 'Listrik & Token',
    amount: 400000,
    date: '2026-10-03',
    description: 'Pengisian token listrik pompa air & penerangan lorong bersama',
    created_at: '2026-10-03T14:30:00Z',
  },
  {
    id: 'fin-4',
    type: 'expense',
    category: 'Internet Wi-Fi',
    amount: 350000,
    date: '2026-10-05',
    description: 'Tagihan bulanan Wi-Fi Indihome 50 Mbps untuk penghuni',
    created_at: '2026-10-05T09:15:00Z',
  },
  {
    id: 'fin-5',
    type: 'expense',
    category: 'Kebersihan & Sampah',
    amount: 75000,
    date: '2026-10-10',
    description: 'Iuran kebersihan lingkungan & pengangkutan sampah RT',
    created_at: '2026-10-10T16:00:00Z',
  },
  {
    id: 'fin-6',
    type: 'income',
    category: 'Uang Muka / DP',
    amount: 500000,
    date: '2026-10-18',
    description: 'DP pemesanan Kamar Anggrek A-02 - Dinda Maharani',
    created_at: '2026-10-18T13:00:00Z',
  },
];

const DEFAULT_BOOKINGS = [
  {
    id: 'book-1',
    room_id: 'room-2',
    room_name: 'Kamar Anggrek A-02',
    full_name: 'Dinda Maharani',
    whatsapp_number: '085712345678',
    check_in_date: '2026-11-01',
    notes: 'Mahasiswi baru semester 1, rencana masuk awal bulan depan.',
    status: 'pending', // 'pending' | 'confirmed' | 'cancelled'
    created_at: '2026-10-18T12:00:00Z',
  },
];

const DEFAULT_OWNER_WHATSAPP = '6281234567890';

// Inisialisasi awal jika localStorage masih kosong
function initLocalStorage() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(DEFAULT_ROOMS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TENANTS)) {
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(DEFAULT_TENANTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FINANCES)) {
    localStorage.setItem(STORAGE_KEYS.FINANCES, JSON.stringify(DEFAULT_FINANCES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(DEFAULT_BOOKINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.WHATSAPP)) {
    localStorage.setItem(STORAGE_KEYS.WHATSAPP, DEFAULT_OWNER_WHATSAPP);
  }
}

// Jalankan inisialisasi saat file dimuat
initLocalStorage();

/**
 * ============================================================================
 * HELPER FORMATTER & SANITIZER
 * ============================================================================
 */
export function formatRupiah(amount) {
  const number = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number);
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export function getOwnerWhatsApp() {
  return localStorage.getItem(STORAGE_KEYS.WHATSAPP) || DEFAULT_OWNER_WHATSAPP;
}

export function setOwnerWhatsApp(number) {
  const clean = String(number || '').replace(/\D/g, '');
  localStorage.setItem(STORAGE_KEYS.WHATSAPP, clean || DEFAULT_OWNER_WHATSAPP);
}

/**
 * ============================================================================
 * MODUL AUTENTIKASI LOKAL (LOGIN CEPAT & DEMO)
 * ============================================================================
 */
export function isOwnerLoggedIn() {
  const auth = localStorage.getItem(STORAGE_KEYS.AUTH);
  if (!auth) return false;
  try {
    const parsed = JSON.parse(auth);
    return Boolean(parsed && parsed.isLoggedIn);
  } catch {
    return false;
  }
}

export function getOwnerSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loginOwnerLocal(email = 'owner@kostputriwinda.com', name = 'Pemilik KostPutriWinda') {
  const session = {
    isLoggedIn: true,
    user: {
      email: email || 'owner@kostputriwinda.com',
      name: name || 'Pemilik KostPutriWinda',
      role: 'owner',
    },
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(session));
  return session;
}

export function logoutOwnerLocal() {
  localStorage.removeItem(STORAGE_KEYS.AUTH);
}

/**
 * ============================================================================
 * MODUL PENGELOLAAN KAMAR (ROOMS)
 * ============================================================================
 */
export function getRooms() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROOMS);
    return raw ? JSON.parse(raw) : DEFAULT_ROOMS;
  } catch {
    return DEFAULT_ROOMS;
  }
}

export function saveRooms(rooms) {
  localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
}

export function addRoom(roomData) {
  const rooms = getRooms();
  const newRoom = {
    id: generateId('room'),
    name: roomData.name,
    price_per_month: Number(roomData.price_per_month) || 0,
    description: roomData.description || '',
    status: roomData.status || 'available',
    image_url: roomData.image_url || '',
    created_at: new Date().toISOString(),
  };
  rooms.unshift(newRoom);
  saveRooms(rooms);
  return newRoom;
}

export function updateRoom(id, updates) {
  const rooms = getRooms();
  const index = rooms.findIndex((r) => r.id === id);
  if (index === -1) return null;

  rooms[index] = {
    ...rooms[index],
    ...updates,
    price_per_month: updates.price_per_month !== undefined ? Number(updates.price_per_month) : rooms[index].price_per_month,
    updated_at: new Date().toISOString(),
  };
  saveRooms(rooms);
  return rooms[index];
}

export function deleteRoom(id) {
  const rooms = getRooms();
  const filtered = rooms.filter((r) => r.id !== id);
  saveRooms(filtered);
  return true;
}

/**
 * ============================================================================
 * MODUL PENGELOLAAN PENGHUNI (TENANTS)
 * ============================================================================
 */
export function getTenants() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TENANTS);
    return raw ? JSON.parse(raw) : DEFAULT_TENANTS;
  } catch {
    return DEFAULT_TENANTS;
  }
}

export function saveTenants(tenants) {
  localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
}

export function addTenant(tenantData) {
  const tenants = getTenants();
  const newTenant = {
    id: generateId('tenant'),
    full_name: tenantData.full_name,
    room_id: tenantData.room_id || '',
    room_name: tenantData.room_name || 'Kamar Kos',
    phone: tenantData.phone || '',
    check_in_date: tenantData.check_in_date || new Date().toISOString().split('T')[0],
    monthly_rent: Number(tenantData.monthly_rent) || 0,
    payment_status: tenantData.payment_status || 'paid', // 'paid' | 'unpaid'
    notes: tenantData.notes || '',
    created_at: new Date().toISOString(),
  };
  tenants.unshift(newTenant);
  saveTenants(tenants);

  // Jika kamar dipilih, sinkronkan status kamar menjadi 'occupied' (Terisi)
  if (newTenant.room_id) {
    updateRoom(newTenant.room_id, { status: 'occupied' });
  }

  // Jika status bayar langsung 'paid', catat otomatis pemasukan di keuangan
  if (newTenant.payment_status === 'paid' && newTenant.monthly_rent > 0) {
    addFinance({
      type: 'income',
      category: 'Sewa Kamar',
      amount: newTenant.monthly_rent,
      date: newTenant.check_in_date,
      description: `Sewa kamar awal - ${newTenant.full_name} (${newTenant.room_name})`,
    });
  }

  return newTenant;
}

export function updateTenant(id, updates) {
  const tenants = getTenants();
  const index = tenants.findIndex((t) => t.id === id);
  if (index === -1) return null;

  tenants[index] = {
    ...tenants[index],
    ...updates,
    monthly_rent: updates.monthly_rent !== undefined ? Number(updates.monthly_rent) : tenants[index].monthly_rent,
    updated_at: new Date().toISOString(),
  };
  saveTenants(tenants);
  return tenants[index];
}

export function toggleTenantPaymentStatus(id) {
  const tenants = getTenants();
  const tenant = tenants.find((t) => t.id === id);
  if (!tenant) return null;

  const nextStatus = tenant.payment_status === 'paid' ? 'unpaid' : 'paid';
  tenant.payment_status = nextStatus;
  saveTenants(tenants);

  // Jika diubah menjadi paid, catat transaksi pemasukan secara otomatis
  if (nextStatus === 'paid' && tenant.monthly_rent > 0) {
    const today = new Date().toISOString().split('T')[0];
    addFinance({
      type: 'income',
      category: 'Sewa Kamar',
      amount: tenant.monthly_rent,
      date: today,
      description: `Pembayaran sewa lunas - ${tenant.full_name} (${tenant.room_name})`,
    });
  }

  return tenant;
}

export function deleteTenant(id) {
  const tenants = getTenants();
  const tenant = tenants.find((t) => t.id === id);
  const filtered = tenants.filter((t) => t.id !== id);
  saveTenants(filtered);

  // Jika ada kamar terkait, kembalikan status kamar menjadi 'available' (Tersedia)
  if (tenant && tenant.room_id) {
    updateRoom(tenant.room_id, { status: 'available' });
  }

  return true;
}

/**
 * ============================================================================
 * MODUL CATATAN KEUANGAN (FINANCES: PEMASUKAN & PENGELUARAN)
 * ============================================================================
 */
export function getFinances() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FINANCES);
    return raw ? JSON.parse(raw) : DEFAULT_FINANCES;
  } catch {
    return DEFAULT_FINANCES;
  }
}

export function saveFinances(finances) {
  localStorage.setItem(STORAGE_KEYS.FINANCES, JSON.stringify(finances));
}

export function addFinance(record) {
  const finances = getFinances();
  const newRecord = {
    id: generateId('fin'),
    type: record.type === 'expense' ? 'expense' : 'income',
    category: record.category || (record.type === 'expense' ? 'Operasional' : 'Sewa Kamar'),
    amount: Math.abs(Number(record.amount)) || 0,
    date: record.date || new Date().toISOString().split('T')[0],
    description: record.description || '-',
    created_at: new Date().toISOString(),
  };
  finances.unshift(newRecord);
  saveFinances(finances);
  return newRecord;
}

export function deleteFinance(id) {
  const finances = getFinances();
  const filtered = finances.filter((f) => f.id !== id);
  saveFinances(filtered);
  return true;
}

export function getFinancialSummary() {
  const finances = getFinances();
  const tenants = getTenants();

  let totalIncome = 0;
  let totalExpense = 0;

  finances.forEach((item) => {
    const amt = Number(item.amount) || 0;
    if (item.type === 'income') {
      totalIncome += amt;
    } else if (item.type === 'expense') {
      totalExpense += amt;
    }
  });

  const netBalance = totalIncome - totalExpense;
  const paidTenants = tenants.filter((t) => t.payment_status === 'paid').length;
  const unpaidTenants = tenants.filter((t) => t.payment_status === 'unpaid').length;

  return {
    totalTenants: tenants.length,
    paidTenants,
    unpaidTenants,
    totalIncome,
    totalExpense,
    netBalance,
  };
}

/**
 * ============================================================================
 * MODUL PEMESANAN PUBLIK (BOOKINGS DARI FORM PENYEWA)
 * ============================================================================
 */
export function getBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return raw ? JSON.parse(raw) : DEFAULT_BOOKINGS;
  } catch {
    return DEFAULT_BOOKINGS;
  }
}

export function saveBookings(bookings) {
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
}

export function addBooking(bookingData) {
  const bookings = getBookings();
  const newBooking = {
    id: generateId('book'),
    room_id: bookingData.room_id || '',
    room_name: bookingData.room_name || 'Kamar Kos',
    full_name: bookingData.full_name,
    whatsapp_number: bookingData.whatsapp_number,
    check_in_date: bookingData.check_in_date,
    notes: bookingData.notes || '',
    status: 'pending', // 'pending' | 'confirmed' | 'cancelled'
    created_at: new Date().toISOString(),
  };
  bookings.unshift(newBooking);
  saveBookings(bookings);
  return newBooking;
}

export function updateBookingStatus(id, newStatus) {
  const bookings = getBookings();
  const item = bookings.find((b) => b.id === id);
  if (!item) return null;

  item.status = newStatus;
  item.updated_at = new Date().toISOString();
  saveBookings(bookings);
  return item;
}

export function deleteBooking(id) {
  const bookings = getBookings();
  const filtered = bookings.filter((b) => b.id !== id);
  saveBookings(filtered);
  return true;
}

/**
 * ============================================================================
 * RESET DATA KE DEMO BAWAAN
 * ============================================================================
 */
export function resetToDemoData() {
  localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(DEFAULT_ROOMS));
  localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(DEFAULT_TENANTS));
  localStorage.setItem(STORAGE_KEYS.FINANCES, JSON.stringify(DEFAULT_FINANCES));
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(DEFAULT_BOOKINGS));
  localStorage.setItem(STORAGE_KEYS.WHATSAPP, DEFAULT_OWNER_WHATSAPP);
}
