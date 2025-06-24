// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCG7gNkTRHDd1evnoZ9If1gSt4ZcmRnFq4",
  authDomain: "arisimale-donation.firebaseapp.com",
  databaseURL: "https://arisimale-donation-default-rtdb.firebaseio.com",
  projectId: "arisimale-donation",
  storageBucket: "arisimale-donation.firebasestorage.app",
  messagingSenderId: "490097348645",
  appId: "1:490097348645:web:94e16aeddfa3e585952fcc",
  measurementId: "G-WJD41DYFPS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Global Variables
let currentUser = null;
let currentSection = 'home';
let submissions = [];
let blockedDates = [];
let notifications = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// DOM Elements
const elements = {
    loginModal: document.getElementById('loginModal'),
    dashboard: document.getElementById('dashboard'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loginForm: document.getElementById('loginForm'),
    userEmail: document.getElementById('userEmail'),
    notificationBtn: document.getElementById('notificationBtn'),
    notificationPanel: document.getElementById('notificationPanel'),
    notificationBadge: document.getElementById('notificationBadge'),
    notificationList: document.getElementById('notificationList'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebar: document.getElementById('sidebar'),
    userMenuBtn: document.getElementById('userMenuBtn'),
    userDropdown: document.getElementById('userDropdown'),
    logoutBtn: document.getElementById('logoutBtn')
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    checkAuthState();
});

// Authentication State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        showDashboard();
        loadDashboardData();
    } else {
        currentUser = null;
        showLoginModal();
    }
});

// Event Listeners
function initializeEventListeners() {
    // Login Form
    elements.loginForm.addEventListener('submit', handleLogin);
    
    // Logout
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Sidebar Toggle
    elements.sidebarToggle.addEventListener('click', toggleSidebar);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const section = e.currentTarget.dataset.section;
            navigateToSection(section);
        });
    });
    
    // User Menu
    elements.userMenuBtn.addEventListener('click', toggleUserMenu);
    
    // Notifications
    elements.notificationBtn.addEventListener('click', toggleNotificationPanel);
    document.getElementById('clearNotifications').addEventListener('click', clearNotifications);
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.userMenuBtn.contains(e.target)) {
            elements.userDropdown.classList.add('hidden');
        }
        if (!elements.notificationBtn.contains(e.target) && !elements.notificationPanel.contains(e.target)) {
            elements.notificationPanel.classList.add('hidden');
        }
    });
    
    // Submissions Section
    document.getElementById('submissionSearch').addEventListener('input', filterSubmissions);
    document.getElementById('submissionFilter').addEventListener('change', filterSubmissions);
    
    // Modal Event Listeners
    initializeModalEventListeners();
}

function initializeModalEventListeners() {
    // View Submission Modal
    document.getElementById('closeViewModal').addEventListener('click', () => {
        document.getElementById('viewSubmissionModal').classList.add('hidden');
    });
    
    // Edit Submission Modal
    document.getElementById('closeEditModal').addEventListener('click', () => {
        document.getElementById('editSubmissionModal').classList.add('hidden');
    });
    
    document.getElementById('editSubmissionForm').addEventListener('submit', handleEditSubmission);
    
    // Add Admin Modal
    document.getElementById('addAdminBtn').addEventListener('click', () => {
        document.getElementById('addAdminModal').classList.remove('hidden');
    });
    
    document.getElementById('closeAddAdminModal').addEventListener('click', () => {
        document.getElementById('addAdminModal').classList.add('hidden');
    });
    
    document.getElementById('cancelAddAdmin').addEventListener('click', () => {
        document.getElementById('addAdminModal').classList.add('hidden');
    });
    
    document.getElementById('addAdminForm').addEventListener('submit', handleAddAdmin);
    
    // Add Blocked Date Modal
    document.getElementById('addBlockedDateBtn').addEventListener('click', () => {
        document.getElementById('addBlockedDateModal').classList.remove('hidden');
    });
    
    document.getElementById('closeAddBlockedDateModal').addEventListener('click', () => {
        document.getElementById('addBlockedDateModal').classList.add('hidden');
    });
    
    document.getElementById('cancelAddBlockedDate').addEventListener('click', () => {
        document.getElementById('addBlockedDateModal').classList.add('hidden');
    });
    
    document.getElementById('addBlockedDateForm').addEventListener('submit', handleAddBlockedDate);
    
    // Export Buttons
    document.getElementById('exportSubmissionsBtn').addEventListener('click', exportSubmissionsToPDF);
    document.getElementById('exportAnalyticsBtn').addEventListener('click', exportAnalyticsToPDF);
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    showLoading(true);
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showNotification('Login successful!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        showNotification('Logged out successfully!', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed: ' + error.message, 'error');
    }
}

function checkAuthState() {
    showLoading(true);
    // Firebase auth state observer will handle the rest
}

function showLoginModal() {
    elements.loginModal.classList.remove('hidden');
    elements.dashboard.classList.add('hidden');
    showLoading(false);
}

function showDashboard() {
    elements.loginModal.classList.add('hidden');
    elements.dashboard.classList.remove('hidden');
    elements.userEmail.textContent = currentUser.email;
    showLoading(false);
}

// Navigation Functions
function navigateToSection(section) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active', 'bg-blue-50', 'text-blue-600');
        item.classList.add('text-gray-700');
    });
    
    document.querySelector(`[data-section="${section}"]`).classList.add('active', 'bg-blue-50', 'text-blue-600');
    document.querySelector(`[data-section="${section}"]`).classList.remove('text-gray-700');
    
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Show selected section
    document.getElementById(`${section}-section`).classList.remove('hidden');
    
    currentSection = section;
    
    // Load section-specific data
    loadSectionData(section);
    
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
        elements.sidebar.classList.add('-translate-x-full');
    }
}

function loadSectionData(section) {
    switch (section) {
        case 'home':
            loadHomeData();
            break;
        case 'submissions':
            loadSubmissions();
            break;
        case 'blocked-dates':
            loadBlockedDates();
            renderCalendar();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'admin-management':
            loadAdminManagement();
            break;
        case 'data-export':
            // No specific data loading needed
            break;
    }
}

// UI Helper Functions
function toggleSidebar() {
    elements.sidebar.classList.toggle('-translate-x-full');
}

function toggleUserMenu() {
    elements.userDropdown.classList.toggle('hidden');
}

function toggleNotificationPanel() {
    elements.notificationPanel.classList.toggle('hidden');
}

function showLoading(show) {
    if (show) {
        elements.loadingOverlay.classList.remove('hidden');
    } else {
        elements.loadingOverlay.classList.add('hidden');
    }
}

function showNotification(message, type = 'success', category = 'system', data = null) {
    const notification = {
        id: Date.now(),
        message: message,
        type: type,
        category: category,
        data: data,
        timestamp: new Date(),
        seen: false
    };
    
    notifications.unshift(notification);
    updateNotificationBadge();
    updateNotificationPanel();
    saveNotifications();
    
    // Show toast notification
    Swal.fire({
        icon: type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info',
        title: message,
        timer: 3000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
    });
}

function updateNotificationBadge() {
    const unseenCount = notifications.filter(n => !n.seen).length;
    if (unseenCount > 0) {
        elements.notificationBadge.textContent = unseenCount;
        elements.notificationBadge.classList.remove('hidden');
    } else {
        elements.notificationBadge.classList.add('hidden');
    }
}

function updateNotificationPanel() {
    const notificationList = elements.notificationList;
    notificationList.innerHTML = '';
    
    if (notifications.length === 0) {
        notificationList.innerHTML = '<div class="p-4 text-center text-gray-500">No notifications</div>';
        return;
    }
    
    notifications.slice(0, 10).forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = `p-4 border-b border-gray-200 ${notification.seen ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-50 cursor-pointer transition-colors`;
        
        // Determine icon and color based on notification type and category
        let icon, colorClass;
        switch (notification.category) {
            case 'submission':
                icon = 'fa-file-alt';
                colorClass = 'text-green-500';
                break;
            case 'update':
                icon = 'fa-edit';
                colorClass = 'text-blue-500';
                break;
            case 'deletion':
                icon = 'fa-trash';
                colorClass = 'text-red-500';
                break;
            case 'blocked_date':
                icon = 'fa-calendar-times';
                colorClass = 'text-purple-500';
                break;
            default:
                icon = 'fa-info-circle';
                colorClass = 'text-gray-500';
        }

        notificationElement.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                    <i class="fas ${icon} ${colorClass} text-lg"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-900 font-medium">${notification.message}</p>
                    <div class="mt-1 flex items-center space-x-2">
                        <p class="text-xs text-gray-500">${formatTimestamp(notification.timestamp)}</p>
                        ${!notification.seen ? '<span class="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>' : ''}
                    </div>
                    ${notification.data ? `
                        <div class="mt-2 text-xs text-gray-600">
                            ${notification.category === 'submission' || notification.category === 'update' ? `
                                <p>Type: ${notification.data.sub_option === 'food_given' ? 'දානමය පිංකම්' : 'මූල්‍යමය ආධාර'}</p>
                                <p>Date: ${formatDate(notification.data.selected_date)}</p>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                ${!notification.seen ? `
                    <button class="text-gray-400 hover:text-gray-600" onclick="markNotificationAsRead(${notification.id}, event)">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
        `;
        
        // Add click handler to view details
        if (notification.data && (notification.category === 'submission' || notification.category === 'update')) {
            notificationElement.addEventListener('click', () => {
                viewSubmission(notification.data.id);
                markNotificationAsRead(notification.id);
            });
        }
        
        notificationList.appendChild(notificationElement);
    });
}

// Add this function for marking notifications as read
function markNotificationAsRead(notificationId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.seen = true;
        updateNotificationBadge();
        updateNotificationPanel();
        saveNotifications();
    }
}

function clearNotifications() {
    notifications = [];
    updateNotificationBadge();
    updateNotificationPanel();
}

// Data Loading Functions
async function loadDashboardData() {
    try {
        await Promise.all([
            loadSubmissions(),
            loadBlockedDates(),
            loadNotifications()
        ]);
        
        initializeNotificationListeners(); // Add this line
        loadHomeData();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

async function loadSubmissions() {
    try {
        const snapshot = await database.ref('form_submissions').once('value');
        const data = snapshot.val();
        submissions = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        
        if (currentSection === 'submissions') {
            renderSubmissions();
        }
        
        // Listen for real-time updates
        database.ref('form_submissions').on('value', (snapshot) => {
            const data = snapshot.val();
            submissions = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            
            if (currentSection === 'submissions') {
                renderSubmissions();
            }
            
            updateHomeStats();
        });
        
    } catch (error) {
        console.error('Error loading submissions:', error);
        showNotification('Error loading submissions', 'error');
    }
}

async function loadBlockedDates() {
    try {
        const snapshot = await database.ref('blocked_dates').once('value');
        const data = snapshot.val();
        blockedDates = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        
        // Listen for real-time updates
        database.ref('blocked_dates').on('value', (snapshot) => {
            const data = snapshot.val();
            blockedDates = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            
            if (currentSection === 'blocked-dates') {
                renderCalendar();
            }
            
            updateHomeStats();
        });
        
    } catch (error) {
        console.error('Error loading blocked dates:', error);
        showNotification('Error loading blocked dates', 'error');
    }
}

async function loadNotifications() {
    // Load notifications from localStorage for now
    const savedNotifications = localStorage.getItem('adminNotifications');
    if (savedNotifications) {
        notifications = JSON.parse(savedNotifications);
        updateNotificationBadge();
        updateNotificationPanel();
    }
}

function loadHomeData() {
    updateHomeStats();
    updateRecentActivity();
}

function updateHomeStats() {
    const totalSubmissions = submissions.length;
    const foodDonations = submissions.filter(s => s.sub_option === 'food_given').length;
    const moneyDonations = submissions.filter(s => s.sub_option === 'money_given').length;
    const blockedDatesCount = blockedDates.length;
    
    document.getElementById('totalSubmissions').textContent = totalSubmissions;
    document.getElementById('foodDonations').textContent = foodDonations;
    document.getElementById('moneyDonations').textContent = moneyDonations;
    document.getElementById('blockedDatesCount').textContent = blockedDatesCount;
}

function updateRecentActivity() {
    const recentActivity = document.getElementById('recentActivity');
    const recentSubmissions = submissions
        .sort((a, b) => (b.submission_time || 0) - (a.submission_time || 0))
        .slice(0, 5);
    
    if (recentSubmissions.length === 0) {
        recentActivity.innerHTML = '<p class="text-gray-500 text-center">No recent activity</p>';
        return;
    }
    
    recentActivity.innerHTML = recentSubmissions.map(submission => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas ${submission.sub_option === 'food_given' ? 'fa-utensils' : 'fa-coins'} text-blue-600 text-sm"></i>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-900">${submission.full_name}</p>
                    <p class="text-xs text-gray-500">${submission.sub_option === 'food_given' ? 'දානමය පිංකම්' : 'මූල්‍යමය ආධාර'}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-xs text-gray-500">${formatDate(submission.selected_date)}</p>
            </div>
        </div>
    `).join('');
}

// Submissions Management
function renderSubmissions() {
    const searchTerm = document.getElementById('submissionSearch').value.toLowerCase();
    const filterType = document.getElementById('submissionFilter').value;
    
    let filteredSubmissions = submissions.filter(submission => {
        const matchesSearch = submission.full_name.toLowerCase().includes(searchTerm) ||
                            submission.address.toLowerCase().includes(searchTerm) ||
                            submission.contact1.includes(searchTerm);
        
        const matchesFilter = !filterType || submission.sub_option === filterType;
        
        return matchesSearch && matchesFilter;
    });
    
    const totalRecords = filteredSubmissions.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalRecords);
    const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);
    
    const tbody = document.getElementById('submissionsTableBody');
    tbody.innerHTML = '';
    
    if (paginatedSubmissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No submissions found</td></tr>';
        return;
    }
    
    paginatedSubmissions.forEach(submission => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap group hover:bg-gray-50 transition-colors duration-200">
            <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <i class="fas fa-user text-blue-600"></i>
                </div>
                </div>
                <div>
                <div class="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                    ${submission.full_name}
                </div>
                <div class="text-xs text-gray-500 flex items-center">
                    <i class="fas fa-map-marker-alt mr-1 text-gray-400"></i>
                    ${submission.address}
                </div>
                </div>
            </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transform transition-transform hover:scale-105 ${
                submission.sub_option === 'food_given' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }">
                <i class="fas ${submission.sub_option === 'food_given' ? 'fa-utensils' : 'fa-coins'} mr-1.5"></i>
                ${submission.sub_option === 'food_given' ? 'දානමය පිංකම්' : 'මූල්‍යමය ආධාර'}
            </span>
            </td>
             <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900 flex items-center">
                ${submission.sub_option === 'food_given' ? 
                    `<i class="fas fa-clock mr-2 text-gray-400"></i>
                     ${formatTimePreference(submission.time_preference)}` : 
                    '-'}
            </div>
        </td>
            <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900 flex items-center">
                <i class="fas fa-calendar-alt mr-2 text-gray-400"></i>
                ${formatDate(submission.selected_date)}
            </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900 flex items-center">
                <i class="fas fa-phone mr-2 text-gray-400"></i>
                ${submission.contact1}
            </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div class="flex items-center space-x-3">
                <button onclick="viewSubmission('${submission.id}')" 
                class="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors duration-200 tooltip-trigger"
                data-tooltip="View Details">
                <i class="fas fa-eye"></i>
                </button>
                <button onclick="editSubmission('${submission.id}')" 
                class="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors duration-200 tooltip-trigger"
                data-tooltip="Edit">
                <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteSubmission('${submission.id}')" 
                class="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200 tooltip-trigger"
                data-tooltip="Delete">
                <i class="fas fa-trash"></i>
                </button>
                <button onclick="printSubmission('${submission.id}')" 
                class="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors duration-200 tooltip-trigger"
                data-tooltip="Print">
                <i class="fas fa-print"></i>
                </button>
            </div>
            </td>
        `;

        // Add tooltip functionality
        row.querySelectorAll('.tooltip-trigger').forEach(button => {
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute hidden bg-gray-800 text-white text-xs rounded px-2 py-1 -mt-8 -ml-1';
            tooltip.textContent = button.dataset.tooltip;
            button.appendChild(tooltip);
            
            button.addEventListener('mouseenter', () => tooltip.classList.remove('hidden'));
            button.addEventListener('mouseleave', () => tooltip.classList.add('hidden'));
        });
        tbody.appendChild(row);
    });
    
    // Update pagination info
    document.getElementById('showingFrom').textContent = startIndex + 1;
    document.getElementById('showingTo').textContent = endIndex;
    document.getElementById('totalRecords').textContent = totalRecords;
    
    renderPagination(totalRecords);
}

function renderPagination(totalRecords) {
    const totalPages = Math.ceil(totalRecords / itemsPerPage);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = `relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''}`;
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderSubmissions();
        }
    });
    pagination.appendChild(prevBtn);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                i === currentPage 
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
            }`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderSubmissions();
            });
            pagination.appendChild(pageBtn);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700';
            ellipsis.textContent = '...';
            pagination.appendChild(ellipsis);
        }
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = `relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === totalPages ? 'cursor-not-allowed opacity-50' : ''}`;
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderSubmissions();
        }
    });
    pagination.appendChild(nextBtn);
}

function filterSubmissions() {
    currentPage = 1;
    renderSubmissions();
}

// Submission Actions
function viewSubmission(id) {
    const submission = submissions.find(s => s.id === id);
    if (!submission) return;
    
    const modal = document.getElementById('viewSubmissionModal');
    const details = document.getElementById('submissionDetails');
    
    details.innerHTML = `
        <div class="bg-white rounded-lg shadow-sm p-6">
            <!-- Header -->
            <div class="border-b border-gray-200 pb-4 mb-6">
                <h3 class="text-lg font-semibold text-gray-900">Submission Details</h3>
                <p class="text-sm text-gray-500">Submitted on ${formatTimestamp(new Date(submission.submission_time))}</p>
            </div>

            <!-- Main Content -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Personal Information Section -->
                <div class="col-span-2 bg-blue-50 rounded-lg p-4">
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-blue-600"></i>
                        </div>
                        <h4 class="font-medium text-blue-900">Personal Information</h4>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-white rounded-lg p-3 shadow-sm">
                            <label class="text-xs font-medium text-gray-500">Full Name</label>
                            <p class="mt-1 text-sm font-semibold text-gray-900">${submission.full_name}</p>
                        </div>
                        <div class="bg-white rounded-lg p-3 shadow-sm">
                            <label class="text-xs font-medium text-gray-500">Address</label>
                            <p class="mt-1 text-sm font-semibold text-gray-900">${submission.address}</p>
                        </div>
                    </div>
                </div>

                <!-- Donation Details Section -->
                <div class="col-span-2 bg-green-50 rounded-lg p-4">
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <i class="fas ${submission.sub_option === 'food_given' ? 'fa-utensils' : 'fa-coins'} text-green-600"></i>
                        </div>
                        <h4 class="font-medium text-green-900">Donation Details</h4>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-white rounded-lg p-3 shadow-sm">
                            <label class="text-xs font-medium text-gray-500">Donation Type</label>
                            <p class="mt-1 text-sm font-semibold text-gray-900">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    submission.sub_option === 'food_given' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                }">
                                    ${submission.sub_option === 'food_given' ? 'දානමය පිංකම්' : 'මූල්‍යමය ආධාර'}
                                </span>
                            </p>
                        </div>
                        <div class="bg-white rounded-lg p-3 shadow-sm">
                            <label class="text-xs font-medium text-gray-500">Time Preference</label>
                            <p class="mt-1 text-sm font-semibold text-gray-900">
                                ${submission.time_preference ? formatTimePreference(submission.time_preference) : 'N/A'}
                            </p>
                        </div>
                        <div class="bg-white rounded-lg p-3 shadow-sm">
                            <label class="text-xs font-medium text-gray-500">Option Type</label>
                            <p class="mt-1 text-sm font-semibold text-gray-900">${submission.option_type}</p>
                        </div>
                        <div class="bg-white rounded-lg p-3 shadow-sm">
                            <label class="text-xs font-medium text-gray-500">Selected Date</label>
                            <p class="mt-1 text-sm font-semibold text-gray-900">${formatDate(submission.selected_date)}</p>
                        </div>
                    </div>
                </div>

                <!-- Contact Information Section -->
                <div class="col-span-2 bg-purple-50 rounded-lg p-4">
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-phone text-purple-600"></i>
                        </div>
                        <h4 class="font-medium text-purple-900">Contact Information</h4>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-white rounded-lg p-3 shadow-sm">
                            <label class="text-xs font-medium text-gray-500">Primary Contact</label>
                            <p class="mt-1 text-sm font-semibold text-gray-900">${submission.contact1}</p>
                        </div>
                        ${submission.contact2 ? `
                        <div class="bg-white rounded-lg p-3 shadow-sm">
                            <label class="text-xs font-medium text-gray-500">Secondary Contact</label>
                            <p class="mt-1 text-sm font-semibold text-gray-900">${submission.contact2}</p>
                        </div>
                        ` : ''}
                        ${submission.contact3 ? `
                        <div class="bg-white rounded-lg p-3 shadow-sm">
                            <label class="text-xs font-medium text-gray-500">Additional Contact</label>
                            <p class="mt-1 text-sm font-semibold text-gray-900">${submission.contact3}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function editSubmission(id) {
    const submission = submissions.find(s => s.id === id);
    if (!submission) return;
    
    const modal = document.getElementById('editSubmissionModal');
    const form = document.getElementById('editSubmissionForm');
    
    form.innerHTML = `
       <input type="hidden" id="editSubmissionId" value="${submission.id}">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Personal Information Section -->
            <div class="md:col-span-2 bg-blue-50 p-4 rounded-lg">
                <h3 class="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <i class="fas fa-user-edit mr-2"></i>
                    Personal Information
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="relative">
                        <label for="editFullName" class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <div class="relative">
                            <i class="fas fa-user absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <input type="text" id="editFullName" value="${submission.full_name}" 
                                class="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm">
                        </div>
                    </div>
                    <div class="md:col-span-2">
                        <label for="editAddress" class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <div class="relative">
                            <i class="fas fa-home absolute left-3 top-3 text-gray-400"></i>
                            <textarea id="editAddress" rows="3" 
                                class="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm">${submission.address}</textarea>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Donation Details Section -->
            <div class="md:col-span-2 bg-green-50 p-4 rounded-lg">
                <h3 class="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <i class="fas fa-hand-holding-heart mr-2"></i>
                    Donation Details
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="relative">
                        <label for="editOptionType" class="block text-sm font-medium text-gray-700 mb-1">Option Type</label>
                        <div class="relative">
                            <i class="fas fa-calendar-alt absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <select id="editOptionType" 
                                class="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm appearance-none">
                                <option value="yearly" ${submission.option_type === 'yearly' ? 'selected' : ''}>Yearly</option>
                                <option value="monthly" ${submission.option_type === 'monthly' ? 'selected' : ''}>Monthly</option>
                                <option value="special" ${submission.option_type === 'special' ? 'selected' : ''}>Special</option>
                            </select>
                            <i class="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                        </div>
                    </div>
                    <div class="relative">
                        <label for="editSubOption" class="block text-sm font-medium text-gray-700 mb-1">Sub Option</label>
                        <div class="relative">
                            <i class="fas fa-gift absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <select id="editSubOption" 
                                class="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm appearance-none">
                                <option value="food_given" ${submission.sub_option === 'food_given' ? 'selected' : ''}>දානමය පිංකම්</option>
                                <option value="money_given" ${submission.sub_option === 'money_given' ? 'selected' : ''}>මූල්‍යමය ආධාර</option>
                            </select>
                            <i class="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                        </div>
                    </div>
                    <div id="timePreferenceContainer" class="relative">
                        <label for="editTimePreference" class="block text-sm font-medium text-gray-700 mb-1">Time Preference</label>
                        <div class="relative">
                            <i class="fas fa-clock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <select id="editTimePreference" 
                                class="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm appearance-none">
                                <option value="">Select Time Preference</option>
                                <option value="morning" ${submission.time_preference === 'morning' ? 'selected' : ''}>උදෑසන ගිලංපස හා දානය</option>
                                <option value="afternoon" ${submission.time_preference === 'afternoon' ? 'selected' : ''}>දහවල් දානය</option>
                                <option value="morning_afternoon" ${submission.time_preference === 'morning_afternoon' ? 'selected' : ''}>උදෑසන සහ දහවල් දානය</option>
                            </select>
                            <i class="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                        </div>
                    </div>
                    <div class="relative">
                        <label for="editSelectedDate" class="block text-sm font-medium text-gray-700 mb-1">Selected Date</label>
                        <div class="relative">
                            <i class="fas fa-calendar absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <input type="date" id="editSelectedDate" value="${submission.selected_date}" 
                                class="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Contact Information Section -->
            <div class="md:col-span-2 bg-purple-50 p-4 rounded-lg">
                <h3 class="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                    <i class="fas fa-phone-alt mr-2"></i>
                    Contact Information
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="relative">
                        <label for="editContact1" class="block text-sm font-medium text-gray-700 mb-1">Primary Contact</label>
                        <div class="relative">
                            <i class="fas fa-phone absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <input type="tel" id="editContact1" value="${submission.contact1}" 
                                class="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm">
                        </div>
                    </div>
                    <div class="relative">
                        <label for="editContact2" class="block text-sm font-medium text-gray-700 mb-1">Secondary Contact</label>
                        <div class="relative">
                            <i class="fas fa-phone absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <input type="tel" id="editContact2" value="${submission.contact2 || ''}" 
                                class="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm">
                        </div>
                    </div>
                    <div class="relative">
                        <label for="editContact3" class="block text-sm font-medium text-gray-700 mb-1">Additional Contact</label>
                        <div class="relative">
                            <i class="fas fa-phone absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <input type="tel" id="editContact3" value="${submission.contact3 || ''}" 
                                class="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6">
            <button type="button" 
                onclick="document.getElementById('editSubmissionModal').classList.add('hidden')" 
                class="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center">
                <i class="fas fa-times mr-2"></i>
                Cancel
            </button>
            <button type="submit" 
                class="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center shadow-lg hover:shadow-xl">
                <i class="fas fa-save mr-2"></i>
                Save Changes
            </button>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

async function handleEditSubmission(e) {
    e.preventDefault();
    showLoading(true);
    
    const id = document.getElementById('editSubmissionId').value;
    const updatedData = {
        full_name: document.getElementById('editFullName').value,
        option_type: document.getElementById('editOptionType').value,
        sub_option: document.getElementById('editSubOption').value,
        time_preference: document.getElementById('editTimePreference').value,
        selected_date: document.getElementById('editSelectedDate').value,
        address: document.getElementById('editAddress').value,
        contact1: document.getElementById('editContact1').value,
        contact2: document.getElementById('editContact2').value,
        contact3: document.getElementById('editContact3').value
    };
    
    try {
        // First find the blocked date entry with matching submission_id
        const blockedDatesRef = database.ref('blocked_dates');
        const snapshot = await blockedDatesRef.orderByChild('submission_id').equalTo(id).once('value');
        
        if (snapshot.exists()) {
            const updates = {};
            
            // Update form_submissions
            updates[`form_submissions/${id}`] = updatedData;
            
            // Update the matching blocked_dates entry
            snapshot.forEach(childSnapshot => {
                const blockedDateKey = childSnapshot.key;
                updates[`blocked_dates/${blockedDateKey}`] = {
                    ...childSnapshot.val(),
                    selected_date: updatedData.selected_date,
                    time_preference: updatedData.time_preference
                };
            });

            // Perform atomic update
            await database.ref().update(updates);
        }

        document.getElementById('editSubmissionModal').classList.add('hidden');
        showNotification('Submission updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating submission:', error);
        showNotification('Error updating submission: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteSubmission(id) {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'This action will delete the submission and its associated blocked dates!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!'
    });
    
    if (result.isConfirmed) {
        showLoading(true);
        
        try {
            // Get the submission first to check its details
            const submissionSnapshot = await database.ref(`form_submissions/${id}`).once('value');
            const submission = submissionSnapshot.val();
            
            if (!submission) {
                throw new Error('Submission not found');
            }
            
            // Find corresponding blocked dates
            const blockedDatesSnapshot = await database.ref('blocked_dates')
                .orderByChild('submission_id')
                .equalTo(id)
                .once('value');
            
            // Create a multi-path update object
            const updates = {};
            
            // Add submission deletion to updates
            updates[`form_submissions/${id}`] = null;
            
            // Add blocked dates deletions to updates
            blockedDatesSnapshot.forEach(childSnapshot => {
                updates[`blocked_dates/${childSnapshot.key}`] = null;
            });
            
            // Execute all deletions in one atomic operation
            await database.ref().update(updates);
            
            showNotification('Submission and associated blocked dates deleted successfully!', 'success');
            
            // Debug log
            console.log(`Deleted submission ${id} and ${blockedDatesSnapshot.numChildren()} associated blocked dates`);
            
        } catch (error) {
            console.error('Error deleting submission and blocked dates:', error);
            showNotification('Error deleting: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }
}

function printSubmission(id) {
    const submission = submissions.find(s => s.id === id);
    if (!submission) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Arisimala Senasuna', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Submission Details', 105, 30, { align: 'center' });
    
    // Line separator
    doc.line(20, 35, 190, 35);
    
    // Submission details
    let yPosition = 50;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Personal Information', 20, yPosition);
    yPosition += 10;
    
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${submission.full_name}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Address: ${submission.address}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Contact 1: ${submission.contact1}`, 20, yPosition);
    yPosition += 8;
    
    if (submission.contact2) {
        doc.text(`Contact 2: ${submission.contact2}`, 20, yPosition);
        yPosition += 8;
    }
    
    if (submission.contact3) {
        doc.text(`Contact 3: ${submission.contact3}`, 20, yPosition);
        yPosition += 8;
    }
    
    yPosition += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Donation Details', 20, yPosition);
    yPosition += 10;
    
    doc.setFont(undefined, 'normal');
    doc.text(`Option Type: ${submission.option_type}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Sub Option: ${submission.sub_option}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Time Preference: ${submission.time_preference ? formatTimePreference(submission.time_preference) : 'N/A'}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Selected Date: ${formatDate(submission.selected_date)}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Submission Time: ${formatTimestamp(new Date(submission.submission_time))}`, 20, yPosition);
    
    // Footer
    yPosition += 20;
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
    
    // Save the PDF
    const fileName = `Submission_${submission.full_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}

// Dashboard Calendar Functions with Enhanced Form Blocking Logic
function renderCalendar() {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    document.getElementById('calendarMonthYear').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        calendarGrid.appendChild(emptyDay);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        const currentDate = new Date(currentYear, currentMonth, day);
        currentDate.setHours(0, 0, 0, 0);
        const dateString = formatDateForCalendar(currentDate);
        
        dayElement.className = 'calendar-day w-15 h-20 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-100 transition-colors';
        dayElement.textContent = day;
        
        // Use the enhanced blocking logic from form calendar
        const isBlocked = isDateBlocked(dateString);
        
        // Check if date is in the past
        const isPastDate = currentDate < today;
        
        if (isBlocked) {
            dayElement.classList.add('blocked-date');
            dayElement.classList.remove('cursor-pointer', 'hover:bg-gray-100');
            dayElement.title = 'This date is blocked for donation';
            
            // Add visual styling for blocked dates (red background like legend)
            dayElement.style.backgroundColor = '#fee2e2'; // Light red background
            dayElement.style.color = '#dc2626'; // Red text
            dayElement.style.cursor = 'not-allowed';
        } else if (isPastDate) {
            dayElement.classList.add('past-date');
            dayElement.classList.remove('cursor-pointer', 'hover:bg-gray-100');
            dayElement.title = 'Past date';
            
            // Add visual styling for past dates
            dayElement.style.backgroundColor = '#f3f4f6'; // Light gray background
            dayElement.style.color = '#9ca3af'; // Gray text
            dayElement.style.cursor = 'not-allowed';
        } else {
            dayElement.classList.add('available-date');
            dayElement.title = 'Available date';
            
            // Available dates styling (blue background like legend)
            dayElement.style.backgroundColor = '#dbeafe'; // Light blue background
            dayElement.style.color = '#1e40af'; // Blue text
            
            // Highlight today's date with stronger styling
            if (currentDate.getTime() === today.getTime()) {
                dayElement.style.backgroundColor = '#3b82f6'; // Solid blue for today
                dayElement.style.color = 'white';
                dayElement.style.fontWeight = 'bold';
                dayElement.title = 'Today - Available';
            }
        }
        
        calendarGrid.appendChild(dayElement);
    }
}

// ENHANCED BLOCKING LOGIC: Same as form calendar with time preference handling
function isDateBlocked(dateString) {
    if (!blockedDates || !blockedDates.length) {
        return false;
    }

    const current = parseDate(dateString);
    if (!current) return false;
    
    // Get existing bookings for this date
    const existingBookings = getExistingBookingsForDate(dateString);
    
    // Check if ANY sub_option has bookings that would block the date
    const hasBlockingBookings = existingBookings.length > 0;
    
    // For food_given bookings, check if ALL time slots are blocked
    const foodGivenBookings = existingBookings.filter(booking => booking.sub_option === 'food_given');
    if (foodGivenBookings.length > 0) {
        // Check if morning_afternoon is booked (fully blocks the date)
        const hasFullDayBooking = foodGivenBookings.some(booking => 
            booking.time_preference === 'morning_afternoon'
        );
        
        if (hasFullDayBooking) {
            return true; // Date is fully blocked
        }

        // Check if both morning and afternoon are separately booked
        const bookedMorning = foodGivenBookings.some(booking => 
            booking.time_preference === 'morning'
        );
        const bookedAfternoon = foodGivenBookings.some(booking => 
            booking.time_preference === 'afternoon'
        );

        // Date is blocked if both morning and afternoon are taken
        if (bookedMorning && bookedAfternoon) {
            return true;
        }
    }
    
    // For money_given bookings, any booking blocks the entire date
    const moneyGivenBookings = existingBookings.filter(booking => booking.sub_option === 'money_given');
    if (moneyGivenBookings.length > 0) {
        return true;
    }
    
    // For other sub_options, any booking blocks the date
    const otherBookings = existingBookings.filter(booking => 
        booking.sub_option !== 'food_given' && booking.sub_option !== 'money_given'
    );
    if (otherBookings.length > 0) {
        return true;
    }
    
    return false;
}

// ENHANCED FUNCTION: Get existing bookings for a specific date (same as form calendar)
function getExistingBookingsForDate(dateString) {
    if (!blockedDates || !blockedDates.length) {
        return [];
    }

    const current = parseDate(dateString);
    if (!current) return [];

    return blockedDates.filter(blockedDate => {
        if (!blockedDate || !blockedDate.selected_date || !blockedDate.option_type || !blockedDate.sub_option) {
            return false;
        }

        const blocked = parseDate(blockedDate.selected_date);
        if (!blocked) return false;

        // Check if this blocked date affects the current date
        switch (blockedDate.option_type) {
            case 'yearly':
                // Same month and day for all years
                return blocked.getMonth() === current.getMonth() && 
                       blocked.getDate() === current.getDate();
                       
            case 'monthly':
                // Same day of every month, but only for dates >= the original blocked date
                const blockedYearMonth = blocked.getFullYear() * 12 + blocked.getMonth();
                const currentYearMonth = current.getFullYear() * 12 + current.getMonth();
                
                return blocked.getDate() === current.getDate() && 
                       currentYearMonth >= blockedYearMonth;
                       
            case 'special':
                // Exact date match only
                return blocked.getFullYear() === current.getFullYear() &&
                       blocked.getMonth() === current.getMonth() &&
                       blocked.getDate() === current.getDate();
                       
            default:
                return false;
        }
    });
}

// ENHANCED parseDate function (same as form calendar)
function parseDate(dateString) {
    if (!dateString || typeof dateString !== 'string') return null;
    
    try {
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        
        // Validate the parsed values
        if (isNaN(year) || isNaN(month) || isNaN(day) || 
            year < 1900 || year > 2100 || 
            month < 1 || month > 12 || 
            day < 1 || day > 31) {
            return null;
        }
        
        const date = new Date(year, month - 1, day);
        date.setHours(0, 0, 0, 0);
        
        // Verify the date is valid (handles cases like Feb 30)
        if (date.getFullYear() !== year || 
            date.getMonth() !== month - 1 || 
            date.getDate() !== day) {
            return null;
        }
        
        return date;
    } catch (error) {
        console.error('Error parsing date:', dateString, error);
        return null;
    }
}

// ENHANCED formatDate function (same as form calendar)
function formatDateForCalendar(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return null;
    }
    
    try {
        const offset = date.getTimezoneOffset();
        const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
        return adjustedDate.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date:', date, error);
        return null;
    }
}

// Alternative formatDate function if your form uses this name
function formatDate(date) {
    return formatDateForCalendar(date);
}

// Calendar navigation functions
function prevMonth() {
    if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
    } else {
        currentMonth--;
    }
    renderCalendar();
}

function nextMonth() {
    if (currentMonth === 11) {
        currentMonth = 0;
        currentYear++;
    } else {
        currentMonth++;
    }
    renderCalendar();
}

// Initialize calendar navigation
document.addEventListener('DOMContentLoaded', function() {
    // Set up navigation buttons
    const prevBtn = document.getElementById('prevMonthCalendar');
    const nextBtn = document.getElementById('nextMonthCalendar');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', prevMonth);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', nextMonth);
    }
    
    // Initialize current month/year if not already set
    if (typeof currentMonth === 'undefined' || typeof currentYear === 'undefined') {
        const today = new Date();
        currentMonth = today.getMonth();
        currentYear = today.getFullYear();
    }
    
    // Render the calendar
    renderCalendar();
});

// ENHANCED helper function to get all blocked dates for current calendar view
function getBlockedDatesForCalendar(year, month) {
    if (!blockedDates || !blockedDates.length) {
        return [];
    }
    
    const blockedDatesInMonth = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Check each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateString = formatDateForCalendar(new Date(year, month, day));
        if (isDateBlocked(dateString)) {
            blockedDatesInMonth.push(day);
        }
    }
    
    return blockedDatesInMonth;
}

// ENHANCED debug function to check blocking logic
function debugBlockedDates() {
    console.log('=== Dashboard Calendar Blocked Dates Debug ===');
    console.log('blockedDates array:', blockedDates);
    console.log('Current month blocked dates:', getBlockedDatesForCalendar(currentYear, currentMonth));
    
    if (blockedDates && blockedDates.length > 0) {
        blockedDates.forEach((blockedDate, index) => {
            console.log(`${index + 1}. Date: ${blockedDate.selected_date}, Type: ${blockedDate.option_type}, SubOption: ${blockedDate.sub_option}, TimePreference: ${blockedDate.time_preference || 'N/A'}`);
        });
    }
    
    // Test a few dates to see blocking logic
    const today = new Date();
    const testDates = [];
    for (let i = 0; i < 7; i++) {
        const testDate = new Date(today);
        testDate.setDate(today.getDate() + i);
        const dateString = formatDateForCalendar(testDate);
        const bookings = getExistingBookingsForDate(dateString);
        const blocked = isDateBlocked(dateString);
        
        testDates.push({
            date: dateString,
            bookings: bookings.length,
            blocked: blocked,
            bookingDetails: bookings
        });
    }
    
    console.log('Next 7 days blocking status:', testDates);
}

// Cached analytics data
let analyticsCache = {
    monthlyData: null,
    lastUpdate: null,
    charts: {
        donationType: null,
        monthlyTrends: null
    }
};

// Analytics Functions with Performance Optimization
async function loadAnalytics() {
    try {
        showLoading(true);
        
        // Initialize charts in parallel
        await Promise.all([
            initDonationTypeChart(),
            initMonthlyTrendsChart(),
            updateAnalyticsStats()
        ]);
        
        showLoading(false);
    } catch (error) {
        console.error('Error loading analytics:', error);
        showNotification('Error loading analytics data', 'error');
        showLoading(false);
    }
}

async function initDonationTypeChart() {
    const ctx = document.getElementById('donutChart')?.getContext('2d');
    if (!ctx) return;

    // Use Web Worker for data processing
    const data = await processDataInBackground('donationType');
    
    if (analyticsCache.charts.donationType) {
        analyticsCache.charts.donationType.destroy();
    }
    
    analyticsCache.charts.donationType = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['දානමය පිංකම්', 'මූල්‍යමය ආධාර'],
            datasets: [{
                data: [data.foodCount, data.moneyCount],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(245, 158, 11, 0.8)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(245, 158, 11, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: {
                    display: true,
                    text: 'Donation Types Distribution'
                }
            },
            animation: {
                duration: 750 // Reduced animation time
            }
        }
    });
}

async function initMonthlyTrendsChart() {
    const ctx = document.getElementById('barChart')?.getContext('2d');
    if (!ctx) return;

    const monthlyData = await getMonthlyDataOptimized();
    
    if (analyticsCache.charts.monthlyTrends) {
        analyticsCache.charts.monthlyTrends.destroy();
    }
    
    analyticsCache.charts.monthlyTrends = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthlyData.labels,
            datasets: [
                {
                    label: 'දානමය පිංකම්',
                    data: monthlyData.foodData,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                },
                {
                    label: 'මූල්‍යමය ආධාර',
                    data: monthlyData.moneyData,
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                legend: { position: 'bottom' },
                title: {
                    display: true,
                    text: 'Monthly Donations Comparison'
                }
            },
            animation: {
                duration: 750 // Reduced animation time
            }
        }
    });
}

async function getMonthlyDataOptimized() {
    // Check cache validity (5 minutes)
    if (analyticsCache.monthlyData && 
        analyticsCache.lastUpdate && 
        (Date.now() - analyticsCache.lastUpdate) < 300000) {
        return analyticsCache.monthlyData;
    }

    // Process data in background
    const data = await processDataInBackground('monthly');
    
    // Cache the results
    analyticsCache.monthlyData = data;
    analyticsCache.lastUpdate = Date.now();
    
    return data;
}

function processDataInBackground(type) {
    return new Promise((resolve) => {
        if (type === 'donationType') {
            const foodCount = submissions.reduce((acc, s) => 
                acc + (s.sub_option === 'food_given' ? 1 : 0), 0);
            const moneyCount = submissions.length - foodCount;
            
            resolve({ foodCount, moneyCount });
        } else if (type === 'monthly') {
            const months = [];
            const foodData = new Array(6).fill(0);
            const moneyData = new Array(6).fill(0);
            
            // Pre-calculate date ranges
            const now = new Date();
            const dateRanges = [];
            for (let i = 5; i >= 0; i--) {
                const month = new Date(now.getFullYear(), now.getMonth() - i);
                months.push(month.toLocaleString('default', { month: 'short' }));
                dateRanges.push({
                    start: new Date(month.getFullYear(), month.getMonth(), 1),
                    end: new Date(month.getFullYear(), month.getMonth() + 1, 0)
                });
            }
            
            // Single pass through submissions
            submissions.forEach(submission => {
                const subDate = new Date(submission.selected_date);
                dateRanges.forEach((range, index) => {
                    if (subDate >= range.start && subDate <= range.end) {
                        if (submission.sub_option === 'food_given') {
                            foodData[index]++;
                        } else {
                            moneyData[index]++;
                        }
                    }
                });
            });
            
            resolve({ labels: months, foodData, moneyData });
        }
    });
}

async function updateAnalyticsStats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // Use structured data for better performance
    const stats = submissions.reduce((acc, submission) => {
        const subDate = new Date(submission.selected_date);
        const isThisMonth = subDate >= monthStart;
        const isLastMonth = subDate >= lastMonthStart && subDate < monthStart;
        const isFood = submission.sub_option === 'food_given';
        
        if (isThisMonth) {
            acc.thisMonth[isFood ? 'food' : 'money']++;
        } else if (isLastMonth) {
            acc.lastMonth[isFood ? 'food' : 'money']++;
        }
        
        return acc;
    }, {
        thisMonth: { food: 0, money: 0 },
        lastMonth: { food: 0, money: 0 }
    });
    
    // Update DOM elements efficiently
    requestAnimationFrame(() => {
        updateStatElement('thisMonthFood', stats.thisMonth.food);
        updateStatElement('thisMonthMoney', stats.thisMonth.money);
        updateStatElement('lastMonthFood', stats.lastMonth.food);
        updateStatElement('lastMonthMoney', stats.lastMonth.money);
        
        updateGrowthElement('foodGrowth', stats.lastMonth.food, stats.thisMonth.food);
        updateGrowthElement('moneyGrowth', stats.lastMonth.money, stats.thisMonth.money);
    });
}

function updateStatElement(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function updateGrowthElement(id, previous, current) {
    const element = document.getElementById(id);
    if (!element) return;
    
    const growth = calculateGrowthRate(previous, current);
    element.textContent = formatGrowthRate(growth);
    element.className = `font-semibold ${getGrowthClass(growth)}`;
}



// Admin Management Functions
function loadAdminManagement() {
    // For now, just show current user
    const adminsList = document.getElementById('adminsList');
    adminsList.innerHTML = `
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-blue-600"></i>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-900">${currentUser.email}</p>
                    <p class="text-xs text-gray-500">Current Admin</p>
                </div>
            </div>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
            </span>
        </div>
    `;
}

async function handleAddAdmin(e) {
    e.preventDefault();
    showLoading(true);
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    try {
        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Sign back in as the original admin
        await auth.signInWithEmailAndPassword(currentUser.email, 'admin_password');
        
        document.getElementById('addAdminModal').classList.add('hidden');
        document.getElementById('addAdminForm').reset();
        showNotification('Admin added successfully!', 'success');
        loadAdminManagement();
    } catch (error) {
        console.error('Error adding admin:', error);
        showNotification('Error adding admin: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Blocked Dates Management
async function handleAddBlockedDate(e) {
    e.preventDefault();
    showLoading(true);
    
    const date = document.getElementById('blockedDate').value;
    const reason = document.getElementById('blockedReason').value;
    
    try {
        const blockedDateId = database.ref().child('blocked_dates').push().key;
        const blockedDateData = {
            selected_date: date,
            reason: reason || 'Admin blocked',
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            option_type: 'admin_blocked',
            sub_option: 'admin_blocked'
        };
        
        await database.ref(`blocked_dates/${blockedDateId}`).set(blockedDateData);
        
        document.getElementById('addBlockedDateModal').classList.add('hidden');
        document.getElementById('addBlockedDateForm').reset();
        showNotification('Blocked date added successfully!', 'success');
    } catch (error) {
        console.error('Error adding blocked date:', error);
        showNotification('Error adding blocked date: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Export Functions
function exportSubmissionsToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Arisimala Senasuna', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text('All Submissions Report', 105, 30, { align: 'center' });
    
    // Line separator
    doc.line(20, 35, 190, 35);
    
    let yPosition = 50;
    
    // Summary
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Summary', 20, yPosition);
    yPosition += 10;
    
    doc.setFont(undefined, 'normal');
    doc.text(`Total Submissions: ${submissions.length}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Food Donations: ${submissions.filter(s => s.sub_option === 'food_given').length}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Money Donations: ${submissions.filter(s => s.sub_option === 'money_given').length}`, 20, yPosition);
    yPosition += 15;
    
    // Submissions list
    doc.setFont(undefined, 'bold');
    doc.text('Submissions List', 20, yPosition);
    yPosition += 10;
    
    submissions.forEach((submission, index) => {
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${submission.full_name}`, 20, yPosition);
        yPosition += 6;
        
        doc.setFont(undefined, 'normal');
        doc.text(`   Type: ${submission.sub_option} | Date: ${formatDate(submission.selected_date)}`, 20, yPosition);
        yPosition += 6;
        doc.text(`   Contact: ${submission.contact1}`, 20, yPosition);
        yPosition += 8;
    });
    
    // Footer
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 285);
    
    // Save the PDF
    const fileName = `All_Submissions_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    showNotification('Submissions exported successfully!', 'success');
}

function exportAnalyticsToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Arisimala Senasuna', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text('Analytics Report', 105, 30, { align: 'center' });
    
    // Line separator
    doc.line(20, 35, 190, 35);
    
    let yPosition = 50;
    
    // Overall stats
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Overall Statistics', 20, yPosition);
    yPosition += 10;
    
    doc.setFont(undefined, 'normal');
    doc.text(`Total Submissions: ${submissions.length}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Food Donations: ${submissions.filter(s => s.sub_option === 'food_given').length}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Money Donations: ${submissions.filter(s => s.sub_option === 'money_given').length}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Blocked Dates: ${blockedDates.length}`, 20, yPosition);
    yPosition += 15;
    
    // Monthly breakdown
    doc.setFont(undefined, 'bold');
    doc.text('Monthly Breakdown (Last 6 Months)', 20, yPosition);
    yPosition += 10;
    
    const monthlyData = getMonthlyData();
    monthlyData.labels.forEach((label, index) => {
        doc.setFont(undefined, 'normal');
        doc.text(`${label}: Food ${monthlyData.foodData[index]}, Money ${monthlyData.moneyData[index]}`, 20, yPosition);
        yPosition += 6;
    });
    
    // Footer
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 285);
    
    // Save the PDF
    const fileName = `Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    showNotification('Analytics exported successfully!', 'success');
}

// Utility Functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateForCalendar(date) {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
}

function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Add this utility function
function formatTimePreference(timePreference) {
    if (!timePreference) return 'Not specified';
    
    switch (timePreference) {
        case 'morning':
            return 'උදෑසන ගිලංපස හා දානය';
        case 'afternoon':
            return 'දහවල් දානය';
        case 'morning_afternoon':
            return 'උදෑසන සහ දහවල් දානය';
        default:
            return timePreference;
    }
}


// Add this after the loadDashboardData() function
function initializeNotificationListeners() {
    // Listen for new submissions
    database.ref('form_submissions').on('child_added', (snapshot) => {
        const submission = { id: snapshot.key, ...snapshot.val() };
        showNotification(
            `New submission from ${submission.full_name}`,
            'success',
            'submission',
            submission
        );
    });

    // Listen for submission updates
    database.ref('form_submissions').on('child_changed', (snapshot) => {
        const submission = { id: snapshot.key, ...snapshot.val() };
        showNotification(
            `Submission updated: ${submission.full_name}`,
            'info',
            'update',
            submission
        );
    });

    // Listen for submission deletions
    database.ref('form_submissions').on('child_removed', (snapshot) => {
        const submission = { id: snapshot.key, ...snapshot.val() };
        showNotification(
            `Submission deleted: ${submission.full_name}`,
            'warning',
            'deletion',
            submission
        );
    });

    // Listen for blocked dates changes
    database.ref('blocked_dates').on('child_added', (snapshot) => {
        const blockedDate = { id: snapshot.key, ...snapshot.val() };
        showNotification(
            `New date blocked: ${formatDate(blockedDate.selected_date)}`,
            'info',
            'blocked_date',
            blockedDate
        );
    });
}

// Save notifications to localStorage
function saveNotifications() {
    localStorage.setItem('adminNotifications', JSON.stringify(notifications));
}

// Auto-save notifications when they change
setInterval(saveNotifications, 5000);

