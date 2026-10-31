import { getRooms, formatRupiah, escapeHtml } from '../lib/storage.js';
import { openBookingModal } from './bookings.js';

let cachedRooms = [];
let currentFilter = 'all';

/**
 * Ambil daftar kamar dari LocalStorage
 */
export async function fetchRooms() {
  cachedRooms = getRooms();
  return { data: cachedRooms, error: null };
}

/**
 * Render room cards di halaman katalog publik
 */
export async function renderPublicRooms() {
  const container = document.getElementById('rooms-grid');
  if (!container) return;

  const rooms = getRooms();
  cachedRooms = rooms;

  // Filter kamar sesuai tab yang dipilih
  let filteredRooms = rooms;
  if (currentFilter === 'available') {
    filteredRooms = rooms.filter((r) => r.status === 'available');
  }

  // Jika belum ada kamar sama sekali
  if (!filteredRooms || filteredRooms.length === 0) {
    container.innerHTML = `
      <div class="empty-state card">
        <div class="empty-icon">🛏️</div>
        <h3>Kamar Belum Tersedia</h3>
        <p>Saat ini belum ada kamar yang sesuai dengan filter yang dipilih.</p>
        <p class="empty-sub">Pemilik kos dapat menambahkan kamar baru melalui menu Portal Pemilik.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  filteredRooms.forEach((room) => {
    const card = document.createElement('article');
    card.className = 'room-card card';
    card.setAttribute('data-id', room.id);

    // Header kartu: Foto atau Visual Fallback
    const cardMedia = document.createElement('div');
    cardMedia.className = 'room-media';

    if (room.image_url && room.image_url.trim().startsWith('http')) {
      const img = document.createElement('img');
      img.src = room.image_url;
      img.alt = `Kamar ${room.name}`;
      img.loading = 'lazy';
      img.className = 'room-img';
      img.onerror = () => {
        img.style.display = 'none';
        cardMedia.appendChild(createRoomFallbackVisual(room.name));
      };
      cardMedia.appendChild(img);
    } else {
      cardMedia.appendChild(createRoomFallbackVisual(room.name));
    }

    // Badge status kamar
    const statusBadge = document.createElement('span');
    statusBadge.className = `status-badge status-${room.status}`;
    if (room.status === 'available') {
      statusBadge.textContent = '● Tersedia';
    } else if (room.status === 'occupied') {
      statusBadge.textContent = '● Terisi Penuh';
    } else {
      statusBadge.textContent = '● Perbaikan';
    }
    cardMedia.appendChild(statusBadge);

    // Body kartu
    const cardBody = document.createElement('div');
    cardBody.className = 'room-body';

    const title = document.createElement('h3');
    title.className = 'room-title';
    title.textContent = room.name;

    const price = document.createElement('div');
    price.className = 'room-price';
    price.innerHTML = `<strong>${formatRupiah(room.price_per_month)}</strong> <span class="price-unit">/ bulan</span>`;

    const descWrapper = document.createElement('div');
    descWrapper.className = 'room-desc-wrapper';

    const descLabel = document.createElement('div');
    descLabel.className = 'room-desc-label';
    descLabel.textContent = 'Fasilitas & Deskripsi:';

    const desc = document.createElement('p');
    desc.className = 'room-desc';
    desc.textContent = room.description;

    descWrapper.appendChild(descLabel);
    descWrapper.appendChild(desc);

    // Tombol aksi pesan
    const cardActions = document.createElement('div');
    cardActions.className = 'room-actions';

    const bookBtn = document.createElement('button');
    bookBtn.className = 'btn btn-primary btn-block';

    if (room.status === 'available') {
      bookBtn.textContent = 'Pesan Kamar Ini';
      bookBtn.onclick = () => openBookingModal(room);
    } else if (room.status === 'occupied') {
      bookBtn.textContent = 'Kamar Sedang Terisi';
      bookBtn.disabled = true;
      bookBtn.classList.add('btn-disabled');
    } else {
      bookBtn.textContent = 'Sedang Dalam Perbaikan';
      bookBtn.disabled = true;
      bookBtn.classList.add('btn-disabled');
    }

    cardActions.appendChild(bookBtn);

    cardBody.appendChild(title);
    cardBody.appendChild(price);
    cardBody.appendChild(descWrapper);
    cardBody.appendChild(cardActions);

    card.appendChild(cardMedia);
    card.appendChild(cardBody);

    container.appendChild(card);
  });
}

/**
 * Visual artistik fallback bertema kamar kos putri
 */
function createRoomFallbackVisual(roomName) {
  const wrapper = document.createElement('div');
  wrapper.className = 'room-fallback-art';
  wrapper.innerHTML = `
    <div class="fallback-pattern">
      <div class="cozy-room-graphic">
        <svg viewBox="0 0 100 80" class="room-svg-art" fill="none" stroke="currentColor">
          <rect x="15" y="42" width="70" height="24" rx="4" stroke-width="2.5" fill="#e5ede5" />
          <path d="M12 66h76" stroke-width="3" stroke-linecap="round" />
          <path d="M15 42V25a5 5 0 0 1 5-5h14a5 5 0 0 1 5 5v17" stroke-width="2.5" />
          <rect x="22" y="30" width="12" height="8" rx="2" stroke-width="2" fill="#fff" />
          <rect x="42" y="30" width="12" height="8" rx="2" stroke-width="2" fill="#fff" />
          <circle cx="76" cy="24" r="7" stroke-width="2" fill="#fcfaf6" />
          <path d="M76 31v11" stroke-width="2" />
          <path d="M72 42h8" stroke-width="2" />
        </svg>
      </div>
      <span class="fallback-label">${escapeHtml(roomName)}</span>
    </div>
  `;
  return wrapper;
}

/**
 * Atur filter kamar (all / available)
 */
export function setRoomFilter(filter) {
  currentFilter = filter;
  renderPublicRooms();
}

export function getCachedRooms() {
  return cachedRooms;
}
