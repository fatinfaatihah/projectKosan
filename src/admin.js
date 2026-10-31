// Config & Password Handling
const DEFAULT_PASSWORD = "winda090807";

function getOwnerPassword() {
  return localStorage.getItem("kpw_owner_password") || DEFAULT_PASSWORD;
}

const defaultTenants = [
  { id: 1, name: "Ayu Lestari", branch: "cb1", room: "101", rent: 1200000 },
  { id: 2, name: "Siti Rahma", branch: "cb2", room: "202", rent: 650000 },
  { id: 3, name: "Nabila Putri", branch: "cb3", room: "305", rent: 1350000 }
];

const defaultFinances = [
  { id: 1, desc: "Sewa Kamar 101 Ayu", branch: "cb1", type: "pemasukan", amount: 1200000 },
  { id: 2, desc: "Beli Token Listrik", branch: "cb1", type: "pengeluaran", amount: 200000 },
  { id: 3, desc: "Sewa Kamar 202 Siti", branch: "cb2", type: "pemasukan", amount: 650000 }
];

// App State
let tenants = JSON.parse(localStorage.getItem("kpw_tenants")) || defaultTenants;
let finances = JSON.parse(localStorage.getItem("kpw_finances")) || defaultFinances;

// Format Currency
const formatRp = (num) => "Rp " + Number(num).toLocaleString("id-ID");

// DOM Elements Auth
const modalAuth = document.getElementById("modal-auth");
const formLoginOwner = document.getElementById("form-login-owner");
const ownerPasswordInput = document.getElementById("owner-password");
const loginErrorMsg = document.getElementById("login-error-msg");
const ownerDashboard = document.getElementById("owner-dashboard");
const btnLogout = document.getElementById("btn-logout");

// Cek Sesi Login
function checkSession() {
  const isAuthenticated = sessionStorage.getItem("is_owner_logged_in");
  if (isAuthenticated === "true") {
    if (modalAuth) modalAuth.classList.add("hidden");
    if (ownerDashboard) ownerDashboard.classList.remove("hidden");
    updateDashboard();
  } else {
    if (modalAuth) modalAuth.classList.remove("hidden");
    if (ownerDashboard) ownerDashboard.classList.add("hidden");
  }
}

// Form Login Submit
if (formLoginOwner) {
  formLoginOwner.addEventListener("submit", (e) => {
    e.preventDefault();
    const enteredPassword = ownerPasswordInput ? ownerPasswordInput.value : "";

    if (enteredPassword === getOwnerPassword()) {
      sessionStorage.setItem("is_owner_logged_in", "true");
      if (modalAuth) modalAuth.classList.add("hidden");
      if (loginErrorMsg) loginErrorMsg.classList.add("hidden");
      if (ownerPasswordInput) ownerPasswordInput.value = "";
      checkSession();
    } else {
      if (loginErrorMsg) loginErrorMsg.classList.remove("hidden");
    }
  });
}

// Handler Logout
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    sessionStorage.removeItem("is_owner_logged_in");
    window.location.href = "./index.html";
  });
}

// Dashboard Render
const filterOwnerBranch = document.getElementById("filter-owner-branch");

function updateDashboard() {
  const selectedBranch = filterOwnerBranch ? filterOwnerBranch.value : "all";

  const filteredTenants = selectedBranch === "all" ? tenants : tenants.filter(t => t.branch === selectedBranch);
  const filteredFinances = selectedBranch === "all" ? finances : finances.filter(f => f.branch === selectedBranch);

  const totalIncome = filteredFinances.filter(f => f.type === "pemasukan").reduce((acc, f) => acc + Number(f.amount), 0);
  const totalExpense = filteredFinances.filter(f => f.type === "pengeluaran").reduce((acc, f) => acc + Number(f.amount), 0);
  const balance = totalIncome - totalExpense;

  const elStatTenants = document.getElementById("stat-tenants");
  const elStatIncome = document.getElementById("stat-income");
  const elStatExpense = document.getElementById("stat-expense");
  const elStatBalance = document.getElementById("stat-balance");

  if (elStatTenants) elStatTenants.innerText = filteredTenants.length;
  if (elStatIncome) elStatIncome.innerText = formatRp(totalIncome);
  if (elStatExpense) elStatExpense.innerText = formatRp(totalExpense);
  if (elStatBalance) elStatBalance.innerText = formatRp(balance);

  const tenantList = document.getElementById("tenant-list");
  if (tenantList) {
    tenantList.innerHTML = filteredTenants.map(t => `
      <tr class="border-b hover:bg-gray-50">
        <td class="p-2 font-medium text-gray-800">${t.name}</td>
        <td class="p-2 text-xs"><span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">${t.branch.toUpperCase()}</span></td>
        <td class="p-2">${t.room}</td>
        <td class="p-2 font-semibold text-emerald-700">${formatRp(t.rent)}</td>
        <td class="p-2 text-right space-x-1">
          <button onclick="openEditTenantModal(${t.id})" class="text-blue-600 hover:text-blue-800 text-xs font-bold">Edit</button>
          <button onclick="deleteTenant(${t.id})" class="text-red-500 hover:text-red-700 text-xs font-bold">Hapus</button>
        </td>
      </tr>
    `).join('');
  }

  const financeList = document.getElementById("finance-list");
  if (financeList) {
    financeList.innerHTML = filteredFinances.map(f => `
      <tr class="border-b hover:bg-gray-50">
        <td class="p-2">${f.desc}</td>
        <td class="p-2 text-xs"><span class="bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-bold">${f.branch.toUpperCase()}</span></td>
        <td class="p-2 font-bold ${f.type === 'pemasukan' ? 'text-blue-600' : 'text-red-600'}">${f.type === 'pemasukan' ? '+ Masuk' : '- Keluar'}</td>
        <td class="p-2 font-semibold">${formatRp(f.amount)}</td>
        <td class="p-2 text-right space-x-1">
          <button onclick="openEditFinanceModal(${f.id})" class="text-blue-600 hover:text-blue-800 text-xs font-bold">Edit</button>
          <button onclick="deleteFinance(${f.id})" class="text-red-500 hover:text-red-700 text-xs font-bold">Hapus</button>
        </td>
      </tr>
    `).join('');
  }

  localStorage.setItem("kpw_tenants", JSON.stringify(tenants));
  localStorage.setItem("kpw_finances", JSON.stringify(finances));
}

// Global Handlers Delete & Edit
window.deleteTenant = (id) => {
  tenants = tenants.filter(t => t.id !== id);
  updateDashboard();
};

window.deleteFinance = (id) => {
  finances = finances.filter(f => f.id !== id);
  updateDashboard();
};

// Form Add Tenant
const formTenant = document.getElementById("form-tenant");
if (formTenant) {
  formTenant.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("tenant-name").value;
    const branch = document.getElementById("tenant-branch").value;
    const room = document.getElementById("tenant-room").value;
    const rent = Number(document.getElementById("tenant-rent").value);

    tenants.push({ id: Date.now(), name, branch, room, rent });
    e.target.reset();
    updateDashboard();
  });
}

// Form Add Finance
const formFinance = document.getElementById("form-finance");
if (formFinance) {
  formFinance.addEventListener("submit", (e) => {
    e.preventDefault();
    const type = document.getElementById("fin-type").value;
    const branch = document.getElementById("fin-branch").value;
    const amount = Number(document.getElementById("fin-amount").value);
    const desc = document.getElementById("fin-desc").value;

    finances.push({ id: Date.now(), type, branch, amount, desc });
    e.target.reset();
    updateDashboard();
  });
}

if (filterOwnerBranch) {
  filterOwnerBranch.addEventListener("change", updateDashboard);
}

const btnResetData = document.getElementById("btn-reset-data");
if (btnResetData) {
  btnResetData.addEventListener("click", () => {
    if (confirm("Reset data ke data sampel contoh?")) {
      tenants = [...defaultTenants];
      finances = [...defaultFinances];
      updateDashboard();
    }
  });
}

// Modal Edit Tenant
window.openEditTenantModal = (id) => {
  const item = tenants.find(t => t.id === id);
  if (!item) return;

  document.getElementById("edit-tenant-id").value = item.id;
  document.getElementById("edit-tenant-name").value = item.name;
  document.getElementById("edit-tenant-branch").value = item.branch;
  document.getElementById("edit-tenant-room").value = item.room;
  document.getElementById("edit-tenant-rent").value = item.rent;

  document.getElementById("modal-edit-tenant").classList.remove("hidden");
};

window.closeEditTenantModal = () => {
  document.getElementById("modal-edit-tenant").classList.add("hidden");
};

document.getElementById("form-edit-tenant")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = Number(document.getElementById("edit-tenant-id").value);
  const name = document.getElementById("edit-tenant-name").value;
  const branch = document.getElementById("edit-tenant-branch").value;
  const room = document.getElementById("edit-tenant-room").value;
  const rent = Number(document.getElementById("edit-tenant-rent").value);

  tenants = tenants.map(t => t.id === id ? { id, name, branch, room, rent } : t);

  closeEditTenantModal();
  updateDashboard();
});

// Modal Edit Finance
window.openEditFinanceModal = (id) => {
  const item = finances.find(f => f.id === id);
  if (!item) return;

  document.getElementById("edit-fin-id").value = item.id;
  document.getElementById("edit-fin-type").value = item.type;
  document.getElementById("edit-fin-branch").value = item.branch;
  document.getElementById("edit-fin-desc").value = item.desc;
  document.getElementById("edit-fin-amount").value = item.amount;

  document.getElementById("modal-edit-finance").classList.remove("hidden");
};

window.closeEditFinanceModal = () => {
  document.getElementById("modal-edit-finance").classList.add("hidden");
};

document.getElementById("form-edit-finance")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = Number(document.getElementById("edit-fin-id").value);
  const type = document.getElementById("edit-fin-type").value;
  const branch = document.getElementById("edit-fin-branch").value;
  const desc = document.getElementById("edit-fin-desc").value;
  const amount = Number(document.getElementById("edit-fin-amount").value);

  finances = finances.map(f => f.id === id ? { id, type, branch, desc, amount } : f);

  closeEditFinanceModal();
  updateDashboard();
});

// Modal Change Password
const modalChangePass = document.getElementById("modal-change-pass");
const btnOpenChangePass = document.getElementById("btn-open-change-pass");
const formChangePassword = document.getElementById("form-change-password");
const changePassMsg = document.getElementById("change-pass-msg");

if (btnOpenChangePass) {
  btnOpenChangePass.addEventListener("click", () => {
    if (modalChangePass) modalChangePass.classList.remove("hidden");
    if (changePassMsg) changePassMsg.classList.add("hidden");
    if (formChangePassword) formChangePassword.reset();
  });
}

window.closeChangePassModal = () => {
  if (modalChangePass) modalChangePass.classList.add("hidden");
};

if (formChangePassword) {
  formChangePassword.addEventListener("submit", (e) => {
    e.preventDefault();
    const oldPass = document.getElementById("old-pass-input").value;
    const newPass = document.getElementById("new-pass-input").value;
    const confirmPass = document.getElementById("confirm-pass-input").value;

    if (oldPass !== getOwnerPassword()) {
      changePassMsg.innerText = "❌ Kata sandi lama salah!";
      changePassMsg.className = "text-xs font-bold text-red-600 block";
      return;
    }

    if (newPass !== confirmPass) {
      changePassMsg.innerText = "❌ Konfirmasi kata sandi baru tidak cocok!";
      changePassMsg.className = "text-xs font-bold text-red-600 block";
      return;
    }

    localStorage.setItem("kpw_owner_password", newPass);

    changePassMsg.innerText = "✅ Kata sandi berhasil diperbarui!";
    changePassMsg.className = "text-xs font-bold text-emerald-600 block";

    setTimeout(() => {
      closeChangePassModal();
    }, 1200);
  });
}

// Inisialisasi
checkSession();