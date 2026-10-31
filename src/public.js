// Data Cabang & Kamar (Public View)
const branchData = {
  cb1: {
    name: "Cabang 1 (Cluster Angsana I)",
    image: new URL('/src/assets/angsana1.jpeg', import.meta.url).href,
    mapUrl: "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3964.510871720988!2d107.03136397499229!3d-6.456766493534732!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zNsKwMjcnMjQuNCJTIDEwN8KwMDInMDIuMiJF!5e0!3m2!1sid!2sid!4v1793071047206!5m2!1sid!2sid",
    rooms: [
      { type: "Kamar Standard", price: "700.000", tag: "Hemat & Praktis", icon: "🛏️", items: ["Kasur & Lemari Pakaian", "Kamar Mandi Luar Bersih", "Gratis Wi-Fi & Listrik", "Meja Belajar & Kursi"] },
      { type: "Kamar AC Exclusive", price: "1.000.000", tag: "Fasilitas Lengkap", isPopular: true, icon: "❄️", items: ["AC (Pendingin Ruangan)", "Kasur dan Lemari", "Kamar Mandi Luar Bersih",  "Gratis Wi-Fi, Air & Listrik", "Meja Belajar & Kursi"] }
    ]
  },
  cb2: {
    name: "Cabang 2 (Cluster Angsana II)",
    image: new URL('/src/assets/angsana2.jpeg', import.meta.url).href,
    mapUrl: "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3964.50979968007!2d107.03088047499229!3d-6.456903393534568!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zNsKwMjcnMjQuOSJTIDEwN8KwMDInMDAuNCJF!5e0!3m2!1sid!2sid!4v1793071093865!5m2!1sid!2sid",
    rooms: [
      { type: "Kamar Standard", price: "700.000", tag: "Hemat & Praktis", icon: "🛏️", items: ["Kasur & Lemari Pakaian", "Kamar Mandi Luar Bersih", "Gratis Wi-Fi & Listrik", "Meja Belajar & Kursi"] },
      { type: "Kamar AC Exclusive", price: "1.000.000", tag: "Fasilitas Lengkap", isPopular: true, icon: "❄️", items: ["AC (Pendingin Ruangan)", "Kasur dan Lemari", "Kamar Mandi Luar Bersih", "Gratis Wi-Fi, Air & Listrik", "Meja Belajar & Kursi"] }
    ]
  },
  cb3: {
    name: "Cabang 3 (Cluster Heliconia)",
    image: new URL('/src/assets/heliconia.jpeg', import.meta.url).href,
    mapUrl: "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3964.517718466643!2d107.0328109749923!3d-6.4558920935356!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zNsKwMjcnMjQuNCJTIDEwN8KwMDInMDIuMiJF!5e0!3m2!1sid!2sid!4v1793071137761!5m2!1sid!2sid",
    rooms: [
      { type: "Kamar Standard", price: "700.000", tag: "Hemat & Praktis", icon: "🛏️", items: ["Kasur & Lemari Pakaian", "Kamar Mandi Luar Bersih", "Gratis Wi-Fi & Listrik", "Meja Belajar & Kursi"] },
      { type: "Kamar AC Exclusive", price: "1.000.000", tag: "Fasilitas Lengkap", isPopular: true, icon: "❄️", items: ["AC (Pendingin Ruangan)", "Kasur dan Lemari", "Kamar Mandi Luar Bersih", "Gratis Wi-Fi, Air & Listrik", "Meja Belajar & Kursi"] }
    ]
  }
};

let currentPublicBranch = "cb1";

// Handler Modal Pemesanan Kamar
window.openBookingModal = (roomType, branchName) => {
  const modal = document.getElementById("modal-booking");
  if (!modal) return;
  
  document.getElementById("booking-room-type").innerText = roomType;
  document.getElementById("booking-branch-name").innerText = branchName;
  document.getElementById("input-room-type").value = roomType;
  document.getElementById("input-branch-name").value = branchName;
  
  modal.classList.remove("hidden");
};

window.closeBookingModal = () => {
  const modal = document.getElementById("modal-booking");
  if (modal) modal.classList.add("hidden");
};

// Form Booking Submit Handler
document.getElementById("form-booking")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const roomType = document.getElementById("input-room-type").value;
  const branchName = document.getElementById("input-branch-name").value;
  const name = document.getElementById("booking-name").value;

  alert(`Terima kasih ${name}! Pesan minat sewa untuk ${roomType} di ${branchName} telah terkirim.`);
  
  closeBookingModal();
  e.target.reset();
});

// Render Public View Rooms & Map
function renderPublicBranch(branchKey) {
  currentPublicBranch = branchKey;
  const data = branchData[branchKey];
  if (!data) return;

  const infoText = document.getElementById("branch-info-text");
  const mapTitle = document.getElementById("map-branch-title");
  const mapIframe = document.getElementById("map-iframe");
  const container = document.getElementById("kamar-container");

  if (infoText) infoText.innerHTML = `📍 Menampilkan kamar untuk <strong>${data.name}</strong>`;
  if (mapTitle) mapTitle.innerText = data.name;
  if (mapIframe) mapIframe.src = data.mapUrl;

  if (container) {
    // Layout 3 kolom sejajar
    container.className = "flex flex-wrap justify-center gap-6 max-w-7xl mx-auto";

    // 1. HTML Card Foto Portrait Kosan
    const buildingCardHTML = `
      <div class="w-full md:w-[360px] bg-white border-2 border-emerald-300 rounded-2xl p-4 shadow-md flex flex-col justify-between transform hover:-translate-y-1 transition">
        <div>
          <div class="relative w-full h-[380px] rounded-xl overflow-hidden mb-4 bg-emerald-100 shadow-inner">
            <img 
              src="${data.image}" 
              alt="${data.name}" 
              class="w-full h-full object-cover"
              onerror="this.onerror=null; this.src='https://via.placeholder.com/400x600?text=Foto+Tampak+Depan+Kos';"
            />
            <span class="absolute top-3 left-3 bg-emerald-800/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
              🏡 Tampak Depan
            </span>
          </div>
          <h3 class="text-xl font-bold text-gray-800">${data.name}</h3>
          <p class="text-xs text-gray-500 mt-1">Lingkungan aman, asri, dan bersih khusus putri.</p>
        </div>
        <a href="#lokasi" class="w-full text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold py-2.5 rounded-xl text-sm transition mt-4">
          📍 Lihat Lokasi di Peta
        </a>
      </div>
    `;

    // 2. HTML Card Pilihan Kamar (Membuka Modal)
    const roomsHTML = data.rooms.map(room => `
      <div class="w-full md:w-[360px] bg-gradient-to-b ${room.isPopular ? 'from-emerald-100/60 via-emerald-50 to-white border-2 border-emerald-500 shadow-xl' : 'from-emerald-50 to-white border-2 border-emerald-200 shadow-md'} rounded-2xl p-6 relative flex flex-col justify-between transform hover:-translate-y-1 transition">
        <div>
          ${room.isPopular ? '<span class="absolute -top-3.5 right-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">⭐ FAVORIT PENGHUNI</span>' : ''}
          <div class="h-44 bg-emerald-100/80 rounded-xl flex items-center justify-center text-5xl mb-6 shadow-inner">${room.icon}</div>
          <span class="bg-emerald-200 text-emerald-900 text-xs font-bold px-2.5 py-1 rounded">${room.tag}</span>
          <h3 class="text-2xl font-bold text-gray-800 mt-2">${room.type}</h3>
          <p class="text-emerald-700 font-black text-3xl my-3">Rp ${room.price} <span class="text-sm font-normal text-gray-500">/ bln</span></p>
          <hr class="my-4 border-emerald-100" />
          <ul class="text-sm text-gray-700 space-y-2.5 font-medium mb-6">
            ${room.items.map(item => `<li class="flex items-center gap-2"><span class="text-emerald-600 font-bold">✓</span> ${item}</li>`).join('')}
          </ul>
        </div>
        <button onclick="openBookingModal('${room.type}', '${data.name}')" class="w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition">
          Pesan Kamar Ini
        </button>
      </div>
    `).join('');

    // Gabungkan Card Foto + Card Kamar
    container.innerHTML = buildingCardHTML + roomsHTML;
  }
}

// Tab Button Click Listeners (Public View)
document.querySelectorAll(".branch-tab-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".branch-tab-btn").forEach(b => {
      b.classList.remove("bg-emerald-700", "text-white", "shadow-md");
      b.classList.add("text-emerald-800");
    });

    const targetBtn = e.target.closest(".branch-tab-btn");
    if (!targetBtn) return;

    targetBtn.classList.add("bg-emerald-700", "text-white", "shadow-md");
    targetBtn.classList.remove("text-emerald-800");

    const branchKey = targetBtn.getAttribute("data-branch");
    renderPublicBranch(branchKey);
  });
});

// Setup Awal
renderPublicBranch("cb1");