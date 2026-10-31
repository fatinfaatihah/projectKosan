import {
  addBooking,
  getOwnerWhatsApp,
  formatRupiah,
} from '../lib/storage.js';
import { toast } from './toast.js';

let activeRoomForBooking = null;

/**
 * Buka modal pemesanan kamar untuk kamar yang dipilih
 */
export function openBookingModal(room) {
  activeRoomForBooking = room;
  const modal = document.getElementById('booking-modal');
  if (!modal) return;

  // Isi data ringkasan kamar
  const roomNameEl = document.getElementById('booking-room-name');
  const roomPriceEl = document.getElementById('booking-room-price');
  const checkInInput = document.getElementById('booking-checkin');

  if (roomNameEl) roomNameEl.textContent = room.name;
  if (roomPriceEl) roomPriceEl.textContent = `${formatRupiah(room.price_per_month)} / bulan`;

  // Set minimum tanggal masuk adalah hari ini
  if (checkInInput) {
    const today = new Date().toISOString().split('T')[0];
    checkInInput.min = today;
    if (!checkInInput.value) {
      checkInInput.value = today;
    }
  }

  // Reset tampilan modal ke form pemesanan
  const formSection = document.getElementById('booking-form-section');
  const confirmSection = document.getElementById('booking-success-section');
  if (formSection) formSection.style.display = 'block';
  if (confirmSection) confirmSection.style.display = 'none';

  // Bersihkan error message jika ada
  const errorBox = document.getElementById('booking-error-box');
  if (errorBox) {
    errorBox.style.display = 'none';
    errorBox.textContent = '';
  }

  modal.classList.add('modal-active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  // Focus input nama
  setTimeout(() => {
    const nameInput = document.getElementById('booking-fullname');
    if (nameInput) nameInput.focus();
  }, 100);
}

/**
 * Tutup modal pemesanan
 */
export function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (!modal) return;

  modal.classList.remove('modal-active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  activeRoomForBooking = null;

  // Reset form input
  const form = document.getElementById('booking-form');
  if (form) form.reset();
}

/**
 * Handle submit pemesanan kamar
 */
export async function handleBookingSubmit(event) {
  event.preventDefault();

  if (!activeRoomForBooking) {
    toast.error('Kamar yang ingin dipesan tidak valid.');
    return;
  }

  const nameInput = document.getElementById('booking-fullname');
  const phoneInput = document.getElementById('booking-phone');
  const checkInInput = document.getElementById('booking-checkin');
  const notesInput = document.getElementById('booking-notes');
  const submitBtn = document.getElementById('booking-submit-btn');
  const errorBox = document.getElementById('booking-error-box');

  const fullName = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const checkInDate = checkInInput ? checkInInput.value : '';
  const notes = notesInput ? notesInput.value.trim() : '';

  // Validasi form
  if (!fullName) {
    showBookingError('Nama lengkap wajib diisi.');
    if (nameInput) nameInput.focus();
    return;
  }

  // Validasi nomor WA
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length < 9) {
    showBookingError('Nomor WhatsApp tidak valid. Masukkan nomor yang aktif (contoh: 081234567890).');
    if (phoneInput) phoneInput.focus();
    return;
  }

  if (!checkInDate) {
    showBookingError('Tanggal rencana masuk wajib diisi.');
    if (checkInInput) checkInInput.focus();
    return;
  }

  // Set loading state
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Menyimpan Pemesanan...';
  }
  if (errorBox) errorBox.style.display = 'none';

  try {
    // Simpan ke LocalStorage sistem bookings
    addBooking({
      room_id: activeRoomForBooking.id,
      room_name: activeRoomForBooking.name,
      full_name: fullName,
      whatsapp_number: phone,
      check_in_date: checkInDate,
      notes: notes || null,
    });

    // Tampilkan konfirmasi sukses
    showBookingSuccess(activeRoomForBooking, {
      fullName,
      phone,
      checkInDate,
      notes,
    });

    toast.success('Pengajuan pemesanan berhasil dikirim!');
  } catch (err) {
    console.error('Error in handleBookingSubmit:', err);
    showBookingError(`Gagal mengirim pemesanan: ${err.message}`);
    toast.error('Gagal mengirim pemesanan.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Kirim Pengajuan Pemesanan';
    }
  }
}

function showBookingError(msg) {
  const errorBox = document.getElementById('booking-error-box');
  if (errorBox) {
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  } else {
    toast.error(msg);
  }
}

/**
 * Tampilkan konfirmasi bahwa pemesanan sudah terkirim (bukan bahwa kamar sudah pasti dipesan)
 */
function showBookingSuccess(room, bookingData) {
  const formSection = document.getElementById('booking-form-section');
  const confirmSection = document.getElementById('booking-success-section');
  if (formSection) formSection.style.display = 'none';
  if (!confirmSection) return;

  confirmSection.style.display = 'block';

  // Format link WhatsApp konfirmasi ke pemilik
  const ownerWa = getOwnerWhatsApp();
  const messageText = encodeURIComponent(
    `Halo KostPutriWinda, saya ${bookingData.fullName} baru saja mengajukan pemesanan untuk ${room.name} dengan rencana masuk tanggal ${bookingData.checkInDate}. Mohon konfirmasi ketersediaan kamar. Terima kasih!`
  );
  const waUrl = `https://wa.me/${ownerWa}?text=${messageText}`;

  // Update elemen konfirmasi dengan teknik aman
  const tenantNameSpan = document.getElementById('confirm-tenant-name');
  const roomNameSpan = document.getElementById('confirm-room-name');
  const waBtn = document.getElementById('confirm-wa-btn');

  if (tenantNameSpan) tenantNameSpan.textContent = bookingData.fullName;
  if (roomNameSpan) roomNameSpan.textContent = room.name;

  if (waBtn) {
    waBtn.href = waUrl;
    waBtn.target = '_blank';
    waBtn.rel = 'noopener noreferrer';
  }
}
