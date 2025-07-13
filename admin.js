import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACHEuejKVniBAcYExQxk23A9QD84bUaB4",
  authDomain: "new-project-6075a.firebaseapp.com",
  projectId: "new-project-6075a",
  storageBucket: "new-project-6075a.appspot.com",
  messagingSenderId: "974403904500",
  appId: "1:974403904500:web:5d4edb5db8f5432cbdcfa1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let currentUser = null;
let usersChart = null;
let debtChart = null;
let allUsers = [];
let allDebtors = [];
let allTransactions = [];
const itemsPerPage = 10;
let currentUsersPage = 1;
let currentDebtorsPage = 1;
let currentTransactionsPage = 1;

// DOM Elements
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const openSidebarBtn = document.getElementById("openSidebar");
const closeSidebarBtn = document.getElementById("closeSidebar");
const logoutBtn = document.getElementById("logoutBtn");
const toggleDarkModeBtn = document.getElementById("toggleDarkMode");
const sections = {
  dashboard: document.getElementById("dashboard"),
  users: document.getElementById("users"),
  debtors: document.getElementById("debtors"),
  transactions: document.getElementById("transactions"),
  settings: document.getElementById("settings")
};
const navLinks = document.querySelectorAll("nav a");
const addUserBtn = document.getElementById("addUserBtn");
const addUserModal = document.getElementById("addUserModal");
const closeAddUserModal = document.getElementById("closeAddUserModal");
const cancelAddUser = document.getElementById("cancelAddUser");
const addUserForm = document.getElementById("addUserForm");
const usersTable = document.getElementById("usersTable");
const searchUsersInput = document.getElementById("searchUsersInput");
const userFilter = document.getElementById("userFilter");
const usersCount = document.getElementById("usersCount");
const prevUsersPage = document.getElementById("prevUsersPage");
const nextUsersPage = document.getElementById("nextUsersPage");
const debtorDetailsModal = document.getElementById("debtorDetailsModal");
const closeDebtorDetailsModal = document.getElementById("closeDebtorDetailsModal");
const debtorDetailsContent = document.getElementById("debtorDetailsContent");
const debtorsTable = document.getElementById("debtorsTable");
const searchDebtorsInput = document.getElementById("searchDebtorsInput");
const debtorFilter = document.getElementById("debtorFilter");
const debtorsCount = document.getElementById("debtorsCount");
const prevDebtorsPage = document.getElementById("prevDebtorsPage");
const nextDebtorsPage = document.getElementById("nextDebtorsPage");
const transactionsTable = document.getElementById("transactionsTable");
const searchTransactionsInput = document.getElementById("searchTransactionsInput");
const transactionTypeFilter = document.getElementById("transactionTypeFilter");
const transactionDateFilter = document.getElementById("transactionDateFilter");
const transactionsCount = document.getElementById("transactionsCount");
const prevTransactionsPage = document.getElementById("prevTransactionsPage");
const nextTransactionsPage = document.getElementById("nextTransactionsPage");
const loadingSpinner = document.getElementById("loadingSpinner");
const recentActivityTable = document.getElementById("recentActivityTable");

// Stats elements
const totalUsersEl = document.getElementById("totalUsers");
const totalDebtorsEl = document.getElementById("totalDebtors");
const totalDebtAmountEl = document.getElementById("totalDebtAmount");
const activeTransactionsEl = document.getElementById("activeTransactions");
const sysUsersCount = document.getElementById("sysUsersCount");
const sysDebtorsCount = document.getElementById("sysDebtorsCount");
const sysTransactionsCount = document.getElementById("sysTransactionsCount");

// Initialize the app
function init() {
  // Check localStorage authentication immediately
  if (!isLocalStorageAuthenticated()) {
    console.log('No localStorage authentication found, redirecting to login');
    window.location.href = "index.html";
    return;
  }
  
  setupEventListeners();
  checkAuthState();
  loadInitialData();
}

// Setup event listeners
function setupEventListeners() {
  // Sidebar
  openSidebarBtn.addEventListener("click", () => {
    sidebar.classList.remove("-translate-x-full");
    sidebarOverlay.classList.remove("hidden");
  });
  
  closeSidebarBtn.addEventListener("click", closeSidebar);
  sidebarOverlay.addEventListener("click", closeSidebar);
  
  // Logout
  logoutBtn.addEventListener("click", () => {
    // Clear localStorage authentication
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminAuthTime');
    
    signOut(auth).then(() => {
      window.location.href = "index.html";
    }).catch(() => {
      // Even if Firebase signOut fails, redirect to login
      window.location.href = "index.html";
    });
  });
  
  // Dark mode toggle
  toggleDarkModeBtn.addEventListener("click", toggleDarkMode);
  
  // Navigation
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("href").substring(1);
      showSection(target);
    });
  });
  
  // Users section
  addUserBtn.addEventListener("click", () => addUserModal.classList.remove("hidden"));
  closeAddUserModal.addEventListener("click", () => addUserModal.classList.add("hidden"));
  cancelAddUser.addEventListener("click", () => addUserModal.classList.add("hidden"));
  addUserForm.addEventListener("submit", handleAddUser);
  searchUsersInput.addEventListener("input", filterUsers);
  userFilter.addEventListener("change", filterUsers);
  prevUsersPage.addEventListener("click", () => {
    if (currentUsersPage > 1) {
      currentUsersPage--;
      renderUsersTable();
    }
  });
  nextUsersPage.addEventListener("click", () => {
    if (currentUsersPage * itemsPerPage < allUsers.length) {
      currentUsersPage++;
      renderUsersTable();
    }
  });
  
  // Debtors section
  searchDebtorsInput.addEventListener("input", filterDebtors);
  debtorFilter.addEventListener("change", filterDebtors);
  prevDebtorsPage.addEventListener("click", () => {
    if (currentDebtorsPage > 1) {
      currentDebtorsPage--;
      renderDebtorsTable();
    }
  });
  nextDebtorsPage.addEventListener("click", () => {
    if (currentDebtorsPage * itemsPerPage < allDebtors.length) {
      currentDebtorsPage++;
      renderDebtorsTable();
    }
  });
  
  // Transactions section
  searchTransactionsInput.addEventListener("input", filterTransactions);
  transactionTypeFilter.addEventListener("change", filterTransactions);
  transactionDateFilter.addEventListener("change", filterTransactions);
  prevTransactionsPage.addEventListener("click", () => {
    if (currentTransactionsPage > 1) {
      currentTransactionsPage--;
      renderTransactionsTable();
    }
  });
  nextTransactionsPage.addEventListener("click", () => {
    if (currentTransactionsPage * itemsPerPage < allTransactions.length) {
      currentTransactionsPage++;
      renderTransactionsTable();
    }
  });
}

// Close sidebar
function closeSidebar() {
  sidebar.classList.add("-translate-x-full");
  sidebarOverlay.classList.add("hidden");
}

// Toggle dark mode
function toggleDarkMode() {
  const html = document.documentElement;
  html.classList.toggle("dark");
  localStorage.setItem("darkMode", html.classList.contains("dark"));
}

// Check localStorage authentication
function isLocalStorageAuthenticated() {
  const authTime = localStorage.getItem('adminAuthTime');
  if (!authTime) return false;
  
  // Check if authentication is still valid (24 hours)
  const now = Date.now();
  const authTimestamp = parseInt(authTime);
  const validDuration = 24 * 60 * 60 * 1000; // 24 hours
  
  return (now - authTimestamp) < validDuration;
}

// Check auth state
function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    console.log('Admin.js auth state changed:', user);
    if (!user && !isLocalStorageAuthenticated()) {
      // Check if we're already on the login page to avoid redirect loops
      if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        return;
      }
      console.log('No user found, redirecting to index.html');
      window.location.href = "index.html";
    } else {
      console.log('User authenticated:', user ? user.uid : 'via localStorage');
      currentUser = user || { uid: 'localStorage-auth', isAnonymous: true };
      showSection("dashboard");
    }
  });
}

// Show section
function showSection(sectionName) {
  // Hide all sections
  Object.values(sections).forEach(section => {
    section.classList.add("hidden");
  });
  
  // Show the selected section
  if (sections[sectionName]) {
    sections[sectionName].classList.remove("hidden");
    
    // Load section data if needed
    switch(sectionName) {
      case "users":
        loadUsers();
        break;
      case "debtors":
        loadDebtors();
        break;
      case "transactions":
        loadTransactions();
        break;
    }
  }
  
  // Update active nav link
  navLinks.forEach(link => {
    if (link.getAttribute("href") === `#${sectionName}`) {
      link.classList.add("bg-blue-100", "dark:bg-blue-900", "text-blue-700", "dark:text-blue-300");
      link.classList.remove("hover:bg-gray-100", "dark:hover:bg-gray-800", "text-gray-700", "dark:text-gray-300");
    } else {
      link.classList.remove("bg-blue-100", "dark:bg-blue-900", "text-blue-700", "dark:text-blue-300");
      link.classList.add("hover:bg-gray-100", "dark:hover:bg-gray-800", "text-gray-700", "dark:text-gray-300");
    }
  });
}

// Load initial data
async function loadInitialData() {
  showLoading();
  
  try {
    // Load stats
    await loadStats();
    
    // Load recent activity
    await loadRecentActivity();
    
    // Initialize charts
    initCharts();
    
    // Hide loading
    hideLoading();
  } catch (error) {
    console.error("Error loading initial data:", error);
    hideLoading();
  }
}

// Load stats
async function loadStats() {
  try {
    // Get users count
    const usersQuery = query(collection(db, "users"));
    const usersSnapshot = await getDocs(usersQuery);
    const usersCount = usersSnapshot.size;
    totalUsersEl.textContent = usersCount;
    sysUsersCount.textContent = usersCount;
    
    // Get debtors count and total debt
    const debtorsQuery = query(collection(db, "debtors"));
    const debtorsSnapshot = await getDocs(debtorsQuery);
    const debtorsCount = debtorsSnapshot.size;
    totalDebtorsEl.textContent = debtorsCount;
    sysDebtorsCount.textContent = debtorsCount;
    
    let totalDebt = 0;
    debtorsSnapshot.forEach(doc => {
      const data = doc.data();
      let add = 0, sub = 0;
      
      if (typeof data.totalAdded === "number") {
        add = data.totalAdded;
      } else {
        (data.history || []).forEach(h => {
          if (h.type === "add") add += h.amount || 0;
        });
      }
      
      if (typeof data.totalSubtracted === "number") {
        sub = data.totalSubtracted;
      } else {
        (data.history || []).forEach(h => {
          if (h.type === "sub") sub += h.amount || 0;
        });
      }
      
      totalDebt += (add - sub);
    });
    
    totalDebtAmountEl.textContent = `${totalDebt.toLocaleString()} so'm`;
    
    // Get transactions count (estimate based on history)
    let transactionsCount = 0;
    debtorsSnapshot.forEach(doc => {
      const data = doc.data();
      transactionsCount += (data.history || []).length;
    });
    
    activeTransactionsEl.textContent = transactionsCount;
    sysTransactionsCount.textContent = transactionsCount;
    
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

// Load recent activity
async function loadRecentActivity() {
  try {
    // Get all debtors with history
    const debtorsQuery = query(collection(db, "debtors"));
    const debtorsSnapshot = await getDocs(debtorsQuery);
    
    // Collect all transactions
    let allTransactions = [];
    
    debtorsSnapshot.forEach(doc => {
      const data = doc.data();
      const history = data.history || [];
      
      history.forEach(transaction => {
        allTransactions.push({
          debtorId: doc.id,
          debtorName: data.name,
          ...transaction,
          date: transaction.date?.toDate ? transaction.date.toDate() : new Date()
        });
      });
    });
    
    // Sort by date (newest first)
    allTransactions.sort((a, b) => b.date - a.date);
    
    // Get last 10
    const recentTransactions = allTransactions.slice(0, 10);
    
    // Render
    renderRecentActivity(recentTransactions);
    
  } catch (error) {
    console.error("Error loading recent activity:", error);
  }
}

// Render recent activity
function renderRecentActivity(transactions) {
  recentActivityTable.innerHTML = "";
  
  if (transactions.length === 0) {
    recentActivityTable.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-4 text-center text-gray-500">Hech qanday faollik topilmadi</td>
      </tr>
    `;
    return;
  }
  
  transactions.forEach(transaction => {
    const row = document.createElement("tr");
    
    // Get user name
    let userName = "Noma'lum";
    if (transaction.authorId) {
      const user = allUsers.find(u => u.uid === transaction.authorId);
      if (user) userName = user.displayName || user.email;
    }
    
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="text-sm font-medium text-gray-900 dark:text-white">${userName}</div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900 dark:text-white">${transaction.debtorName}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${transaction.type === "add" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}">
          ${transaction.type === "add" ? "+" : "-"}${transaction.amount} so'm
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        ${transaction.date.toLocaleString("uz-UZ")}
      </td>
    `;
    
    recentActivityTable.appendChild(row);
  });
}

// Initialize charts
function initCharts() {
  // Users Chart
  const usersCtx = document.getElementById("usersChart").getContext("2d");
  usersChart = new Chart(usersCtx, {
    type: "line",
    data: {
      labels: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul"],
      datasets: [{
        label: "Yangi Foydalanuvchilar",
        data: [12, 19, 3, 5, 2, 3, 15],
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  // Debt Chart
  const debtCtx = document.getElementById("debtChart").getContext("2d");
  debtChart = new Chart(debtCtx, {
    type: "bar",
    data: {
      labels: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul"],
      datasets: [
        {
          label: "Qo'shilgan",
          data: [1200000, 1900000, 300000, 500000, 200000, 300000, 1500000],
          backgroundColor: "rgba(16, 185, 129, 0.7)",
        },
        {
          label: "Ayirilgan",
          data: [800000, 1200000, 250000, 400000, 150000, 200000, 1000000],
          backgroundColor: "rgba(239, 68, 68, 0.7)",
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value.toLocaleString() + " so'm";
            }
          }
        }
      }
    }
  });
}

// Load users
async function loadUsers() {
  showLoading();
  
  try {
    const usersQuery = query(collection(db, "users"), orderBy("name"));
    const usersSnapshot = await getDocs(usersQuery);
    
    allUsers = [];
    usersSnapshot.forEach(doc => {
      allUsers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    renderUsersTable();
    hideLoading();
  } catch (error) {
    console.error("Error loading users:", error);
    hideLoading();
  }
}

// Filter users
function filterUsers() {
  const searchTerm = searchUsersInput.value.toLowerCase();
  const filterValue = userFilter.value;
  
  let filteredUsers = [...allUsers];
  
  // Apply search filter
  if (searchTerm) {
    filteredUsers = filteredUsers.filter(user => 
      user.name.toLowerCase().includes(searchTerm) || 
      user.email?.toLowerCase().includes(searchTerm) ||
      user.sidebarUserCode?.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply status filter
  if (filterValue !== "all") {
    filteredUsers = filteredUsers.filter(user => {
      if (filterValue === "active") return user.status !== "inactive";
      if (filterValue === "inactive") return user.status === "inactive";
      return true;
    });
  }
  
  // Update the table with filtered users
  renderUsersTable(filteredUsers);
}

// Render users table
function renderUsersTable(users = allUsers) {
  usersCount.textContent = users.length;
  
  // Calculate pagination
  const startIndex = (currentUsersPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = users.slice(startIndex, endIndex);
  
  // Update pagination buttons
  prevUsersPage.disabled = currentUsersPage === 1;
  nextUsersPage.disabled = endIndex >= users.length;
  
  // Clear table
  usersTable.innerHTML = "";
  
  if (paginatedUsers.length === 0) {
    usersTable.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-4 text-center text-gray-500">Hech qanday foydalanuvchi topilmadi</td>
      </tr>
    `;
    return;
  }
  
  // Add rows
  paginatedUsers.forEach(user => {
    const row = document.createElement("tr");
    
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-mono text-gray-900 dark:text-white">${user.sidebarUserCode || user.id}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="flex-shrink-0 h-10 w-10">
            <img class="h-10 w-10 rounded-full" src="${user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=0D8ABC&color=fff`}" alt="">
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900 dark:text-white">${user.name}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">${user.sidebarNumber ? `#${user.sidebarNumber}` : ""}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900 dark:text-white">${user.email || "N/A"}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900 dark:text-white">${user.debtorsCount || 0}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${user.status === "inactive" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"}">
          ${user.status === "inactive" ? "Nofaol" : "Faol"}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">Tahrirlash</button>
        <button class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">O'chirish</button>
      </td>
    `;
    
    usersTable.appendChild(row);
  });
}

// Load debtors
async function loadDebtors() {
  showLoading();
  
  try {
    const debtorsQuery = query(collection(db, "debtors"), orderBy("name"));
    const debtorsSnapshot = await getDocs(debtorsQuery);
    
    allDebtors = [];
    debtorsSnapshot.forEach(doc => {
      allDebtors.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    renderDebtorsTable();
    hideLoading();
  } catch (error) {
    console.error("Error loading debtors:", error);
    hideLoading();
  }
}

// Filter debtors
function filterDebtors() {
  const searchTerm = searchDebtorsInput.value.toLowerCase();
  const filterValue = debtorFilter.value;
  
  let filteredDebtors = [...allDebtors];
  
  // Apply search filter
  if (searchTerm) {
    filteredDebtors = filteredDebtors.filter(debtor => 
      debtor.name.toLowerCase().includes(searchTerm) || 
      debtor.code?.toLowerCase().includes(searchTerm) ||
      debtor.product?.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply status filter
  if (filterValue !== "all") {
    filteredDebtors = filteredDebtors.filter(debtor => {
      let totalAdd = 0, totalSub = 0;
      
      if (typeof debtor.totalAdded === "number") {
        totalAdd = debtor.totalAdded;
      } else {
        (debtor.history || []).forEach(h => {
          if (h.type === "add") totalAdd += h.amount || 0;
        });
      }
      
      if (typeof debtor.totalSubtracted === "number") {
        totalSub = debtor.totalSubtracted;
      } else {
        (debtor.history || []).forEach(h => {
          if (h.type === "sub") totalSub += h.amount || 0;
        });
      }
      
      const remaining = totalAdd - totalSub;
      
      if (filterValue === "active") return remaining > 0;
      if (filterValue === "paid") return remaining <= 0;
      return true;
    });
  }
  
  // Update the table with filtered debtors
  renderDebtorsTable(filteredDebtors);
}

// Render debtors table
function renderDebtorsTable(debtors = allDebtors) {
  debtorsCount.textContent = debtors.length;
  
  // Calculate pagination
  const startIndex = (currentDebtorsPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDebtors = debtors.slice(startIndex, endIndex);
  
  // Update pagination buttons
  prevDebtorsPage.disabled = currentDebtorsPage === 1;
  nextDebtorsPage.disabled = endIndex >= debtors.length;
  
  // Clear table
  debtorsTable.innerHTML = "";
  
  if (paginatedDebtors.length === 0) {
    debtorsTable.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-4 text-center text-gray-500">Hech qanday qarzdor topilmadi</td>
      </tr>
    `;
    return;
  }
  
  // Add rows
  paginatedDebtors.forEach(debtor => {
    // Calculate totals
    let totalAdd = 0, totalSub = 0;
    
    if (typeof debtor.totalAdded === "number") {
      totalAdd = debtor.totalAdded;
    } else {
      (debtor.history || []).forEach(h => {
        if (h.type === "add") totalAdd += h.amount || 0;
      });
    }
    
    if (typeof debtor.totalSubtracted === "number") {
      totalSub = debtor.totalSubtracted;
    } else {
      (debtor.history || []).forEach(h => {
        if (h.type === "sub") totalSub += h.amount || 0;
      });
    }
    
    const remaining = totalAdd - totalSub;
    
    // Get owner name
    let ownerName = "Noma'lum";
    if (debtor.userId) {
      const owner = allUsers.find(u => u.id === debtor.userId);
      if (owner) ownerName = owner.name;
    }
    
    // Get last action
    let lastAction = "Noma'lum";
    if (debtor.history && debtor.history.length > 0) {
      const last = debtor.history[debtor.history.length - 1];
      const date = last.date?.toDate ? last.date.toDate() : new Date();
      lastAction = `${date.toLocaleDateString("uz-UZ")} (${last.type === "add" ? "+" : "-"}${last.amount} so'm)`;
    }
    
    const row = document.createElement("tr");
    
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-mono text-gray-900 dark:text-white">${debtor.code || debtor.id}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900 dark:text-white">${debtor.name}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">${debtor.product || ""}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900 dark:text-white">${ownerName}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900 dark:text-white">${remaining.toLocaleString()} so'm</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-500 dark:text-gray-400">${lastAction}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button class="view-debtor-btn text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3" data-id="${debtor.id}">Ko'rish</button>
        <button class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">O'chirish</button>
      </td>
    `;
    
    // Add event listener to view button
    row.querySelector(".view-debtor-btn").addEventListener("click", () => {
      showDebtorDetails(debtor.id);
    });
    
    debtorsTable.appendChild(row);
  });
}

// Load transactions
async function loadTransactions() {
  showLoading();
  
  try {
    // Get all debtors with history
    const debtorsQuery = query(collection(db, "debtors"));
    const debtorsSnapshot = await getDocs(debtorsQuery);
    
    allTransactions = [];
    
    debtorsSnapshot.forEach(doc => {
      const data = doc.data();
      const history = data.history || [];
      
      history.forEach(transaction => {
        allTransactions.push({
          debtorId: doc.id,
          debtorName: data.name,
          ...transaction,
          date: transaction.date?.toDate ? transaction.date.toDate() : new Date()
        });
      });
    });
    
    // Sort by date (newest first)
    allTransactions.sort((a, b) => b.date - a.date);
    
    renderTransactionsTable();
    hideLoading();
  } catch (error) {
    console.error("Error loading transactions:", error);
    hideLoading();
  }
}

// Filter transactions
function filterTransactions() {
  const searchTerm = searchTransactionsInput.value.toLowerCase();
  const typeFilter = transactionTypeFilter.value;
  const dateFilter = transactionDateFilter.value;
  
  let filteredTransactions = [...allTransactions];
  
  // Apply search filter
  if (searchTerm) {
    filteredTransactions = filteredTransactions.filter(transaction => 
      transaction.debtorName.toLowerCase().includes(searchTerm) || 
      (transaction.note && transaction.note.toLowerCase().includes(searchTerm)) ||
      (transaction.product && transaction.product.toLowerCase().includes(searchTerm))
    );
  }
  
  // Apply type filter
  if (typeFilter !== "all") {
    filteredTransactions = filteredTransactions.filter(transaction => 
      transaction.type === typeFilter
    );
  }
  
  // Apply date filter
  if (dateFilter) {
    const filterDate = new Date(dateFilter);
    filteredTransactions = filteredTransactions.filter(transaction => {
      const transactionDate = transaction.date;
      return transactionDate.getFullYear() === filterDate.getFullYear() &&
             transactionDate.getMonth() === filterDate.getMonth() &&
             transactionDate.getDate() === filterDate.getDate();
    });
  }
  
  // Update the table with filtered transactions
  renderTransactionsTable(filteredTransactions);
}

// Render transactions table
function renderTransactionsTable(transactions = allTransactions) {
  transactionsCount.textContent = transactions.length;
  
  // Calculate pagination
  const startIndex = (currentTransactionsPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);
  
  // Update pagination buttons
  prevTransactionsPage.disabled = currentTransactionsPage === 1;
  nextTransactionsPage.disabled = endIndex >= transactions.length;
  
  // Clear table
  transactionsTable.innerHTML = "";
  
  if (paginatedTransactions.length === 0) {
    transactionsTable.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-4 text-center text-gray-500">Hech qanday tranzaksiya topilmadi</td>
      </tr>
    `;
    return;
  }
  
  // Add rows
  paginatedTransactions.forEach(transaction => {
    const row = document.createElement("tr");
    
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-mono text-gray-900 dark:text-white">${transaction.debtorId.slice(0, 8)}...</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900 dark:text-white">${transaction.debtorName}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${transaction.type === "add" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}">
          ${transaction.type === "add" ? "Qo'shilgan" : "Ayirilgan"}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900 dark:text-white">${transaction.amount.toLocaleString()} so'm</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-500 dark:text-gray-400">${transaction.date.toLocaleString("uz-UZ")}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-500 dark:text-gray-400">${transaction.note || ""}</div>
      </td>
    `;
    
    transactionsTable.appendChild(row);
  });
}

// Show debtor details
async function showDebtorDetails(debtorId) {
  showLoading();
  
  try {
    const debtorDoc = await getDoc(doc(db, "debtors", debtorId));
    if (!debtorDoc.exists()) {
      alert("Qarzdor topilmadi");
      hideLoading();
      return;
    }
    
    const debtor = { id: debtorDoc.id, ...debtorDoc.data() };
    
    // Calculate totals
    let totalAdd = 0, totalSub = 0;
    
    if (typeof debtor.totalAdded === "number") {
      totalAdd = debtor.totalAdded;
    } else {
      (debtor.history || []).forEach(h => {
        if (h.type === "add") totalAdd += h.amount || 0;
      });
    }
    
    if (typeof debtor.totalSubtracted === "number") {
      totalSub = debtor.totalSubtracted;
    } else {
      (debtor.history || []).forEach(h => {
        if (h.type === "sub") totalSub += h.amount || 0;
      });
    }
    
    const remaining = totalAdd - totalSub;
    
    // Get owner name
    let ownerName = "Noma'lum";
    if (debtor.userId) {
      const ownerDoc = await getDoc(doc(db, "users", debtor.userId));
      if (ownerDoc.exists()) {
        ownerName = ownerDoc.data().name || ownerDoc.data().email || debtor.userId;
      }
    }
    
    // Render debtor details
    debtorDetailsContent.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="col-span-1">
          <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Asosiy Ma'lumotlar</h4>
            
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Ism</label>
                <p class="mt-1 text-sm text-gray-900 dark:text-white">${debtor.name}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Kod</label>
                <p class="mt-1 text-sm text-gray-900 dark:text-white">${debtor.code || "N/A"}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Egasi</label>
                <p class="mt-1 text-sm text-gray-900 dark:text-white">${ownerName}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Mahsulot</label>
                <p class="mt-1 text-sm text-gray-900 dark:text-white">${debtor.product || "N/A"}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
                <p class="mt-1 text-sm text-gray-900 dark:text-white">${debtor.note || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-span-2">
          <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Tarix</h4>
            
            <div class="overflow-y-auto max-h-96">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead class="bg-gray-200 dark:bg-gray-800">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Turi</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Miqdor</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Sana</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Izoh</th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-600">
                  ${(debtor.history && debtor.history.length > 0) ? 
                    debtor.history.map(transaction => {
                      const date = transaction.date?.toDate ? transaction.date.toDate() : new Date();
                      return `
                        <tr>
                          <td class="px-4 py-2 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${transaction.type === "add" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}">
                              ${transaction.type === "add" ? "Qo'shilgan" : "Ayirilgan"}
                            </span>
                          </td>
                          <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">${transaction.amount.toLocaleString()} so'm</td>
                          <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${date.toLocaleString("uz-UZ")}</td>
                          <td class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">${transaction.note || ""}</td>
                        </tr>
                      `;
                    }).join("") : `
                    <tr>
                      <td colspan="4" class="px-4 py-4 text-center text-sm text-gray-500">Hech qanday tranzaksiya topilmadi</td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow">
          <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jami Qo'shilgan</div>
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">${totalAdd.toLocaleString()}</div>
          <div class="text-green-600 dark:text-green-400 font-semibold">so'm</div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow">
          <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jami Ayirilgan</div>
          <div class="text-2xl font-bold text-red-500 dark:text-red-400">${totalSub.toLocaleString()}</div>
          <div class="text-red-500 dark:text-red-400 font-semibold">so'm</div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow">
          <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qarzdorlik</div>
          <div class="text-2xl font-bold ${remaining > 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}">${remaining.toLocaleString()}</div>
          <div class="${remaining > 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"} font-semibold">so'm</div>
        </div>
      </div>
      
      <div class="flex justify-end gap-3">
        <button id="closeDebtorDetails" class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
          Yopish
        </button>
        <button class="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white">
          O'chirish
        </button>
      </div>
    `;
    
    // Add event listener to close button
    debtorDetailsContent.querySelector("#closeDebtorDetails").addEventListener("click", () => {
      debtorDetailsModal.classList.add("hidden");
    });
    
    debtorDetailsModal.classList.remove("hidden");
    hideLoading();
  } catch (error) {
    console.error("Error loading debtor details:", error);
    hideLoading();
  }
}

// Handle add user
async function handleAddUser(e) {
  e.preventDefault();
  
  const name = addUserForm[0].value.trim();
  const email = addUserForm[1].value.trim();
  const password = addUserForm[2].value;
  const role = addUserForm[3].value;
  
  if (!name || !email || !password) {
    alert("Iltimos, barcha maydonlarni to'ldiring");
    return;
  }
  
  showLoading();
  
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    
    // Create user document in Firestore
    await setDoc(doc(db, "users", userId), {
      name,
      email,
      role,
      status: "active",
      createdAt: new Date(),
      sidebarNumber: Math.floor(Math.random() * 999) + 1,
      sidebarUserCode: generateRandomCode(8)
    });
    
    // Refresh users list
    await loadUsers();
    
    // Close modal and reset form
    addUserModal.classList.add("hidden");
    addUserForm.reset();
    
    hideLoading();
  } catch (error) {
    console.error("Error adding user:", error);
    alert(`Xatolik yuz berdi: ${error.message}`);
    hideLoading();
  }
}

// Generate random code
function generateRandomCode(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Show loading spinner
function showLoading() {
  loadingSpinner.classList.remove("hidden");
}

// Hide loading spinner
function hideLoading() {
  loadingSpinner.classList.add("hidden");
}

// Initialize the app
init();