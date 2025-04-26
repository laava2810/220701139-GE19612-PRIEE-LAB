// API Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Update if your Flask backend runs on a different port
let currentUser = null;

// DOM Elements
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const loginForm = document.querySelector('#login-modal form');
const signupForm = document.querySelector('#signup-modal form');
const loginBtn = document.getElementById('login-btn');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const closeModals = document.querySelectorAll('.close-modal');

// Mobile Navigation
document.querySelector('.hamburger').addEventListener('click', function() {
    document.querySelector('.nav-links').classList.toggle('active');
});

// Modal functionality
loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.style.display = 'block';
});

showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.style.display = 'none';
    signupModal.style.display = 'block';
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupModal.style.display = 'none';
    loginModal.style.display = 'block';
});

closeModals.forEach(button => {
    button.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});

window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Authentication Functions
async function registerUser(username, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        return data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store token and user data
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        currentUser = data.user;

        // Update UI
        updateAuthUI();

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    updateAuthUI();
    window.location.href = 'index.html';
}

function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const loginBtn = document.getElementById('login-btn');
    
    if (user) {
        loginBtn.textContent = 'Logout';
        loginBtn.href = '#';
        loginBtn.onclick = logoutUser;
        
        // Add user dropdown or other logged-in UI elements here
    } else {
        loginBtn.textContent = 'Login';
        loginBtn.href = '#';
        loginBtn.onclick = function(e) {
            e.preventDefault();
            document.getElementById('login-modal').style.display = 'block';
        };
    }
}

// Form Event Listeners
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    try {
        await registerUser(username, email, password);
        alert('Registration successful! Please login.');
        signupModal.style.display = 'none';
        loginModal.style.display = 'block';
        signupForm.reset();
    } catch (error) {
        alert(error.message);
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        await loginUser(email, password);
        loginModal.style.display = 'none';
        loginForm.reset();
        
        // Refresh the current page to update content based on auth state
        window.location.reload();
    } catch (error) {
        alert(error.message);
    }
});

// API Helper Functions
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('Not authenticated');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
        // Token expired or invalid
        logoutUser();
        throw new Error('Session expired. Please login again.');
    }
    
    return response;
}

// Vendor Management Functions
async function fetchVendors(category = null) {
    try {
        let url = `${API_BASE_URL}/vendors`;
        if (category) {
            url += `?category=${encodeURIComponent(category)}`;
        }
        
        const response = await fetchWithAuth(url);
        return await response.json();
    } catch (error) {
        console.error('Error fetching vendors:', error);
        throw error;
    }
}

async function createVendor(vendorData) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/vendors`, {
            method: 'POST',
            body: JSON.stringify(vendorData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating vendor:', error);
        throw error;
    }
}

async function updateVendor(vendorId, vendorData) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/vendors/${vendorId}`, {
            method: 'PUT',
            body: JSON.stringify(vendorData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating vendor:', error);
        throw error;
    }
}

async function deleteVendor(vendorId) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/vendors/${vendorId}`, {
            method: 'DELETE'
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting vendor:', error);
        throw error;
    }
}

// Contract Management Functions
async function fetchContracts(status = null) {
    try {
        let url = `${API_BASE_URL}/contracts`;
        if (status) {
            url += `?status=${encodeURIComponent(status)}`;
        }
        
        const response = await fetchWithAuth(url);
        return await response.json();
    } catch (error) {
        console.error('Error fetching contracts:', error);
        throw error;
    }
}

async function createContract(contractData) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/contracts`, {
            method: 'POST',
            body: JSON.stringify(contractData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating contract:', error);
        throw error;
    }
}

async function updateContract(contractId, contractData) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/contracts/${contractId}`, {
            method: 'PUT',
            body: JSON.stringify(contractData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating contract:', error);
        throw error;
    }
}

async function deleteContract(contractId) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/contracts/${contractId}`, {
            method: 'DELETE'
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting contract:', error);
        throw error;
    }
}

// Analytics Functions
async function fetchAnalyticsSummary() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/analytics/summary`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching analytics summary:', error);
        throw error;
    }
}

async function fetchVendorsByCategory() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/analytics/vendors-by-category`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching vendors by category:', error);
        throw error;
    }
}

async function fetchSpendingByVendor() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/analytics/spending-by-vendor`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching spending by vendor:', error);
        throw error;
    }
}

async function fetchContractStatus() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/analytics/contract-status`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching contract status:', error);
        throw error;
    }
}

async function fetchVendorPerformance() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/analytics/vendor-performance`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching vendor performance:', error);
        throw error;
    }
}

// Profile Functions
async function fetchTopPerformingVendors() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/profiles/top-performing`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching top performing vendors:', error);
        throw error;
    }
}

async function fetchVendorPerformanceReviews(vendorId) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/profiles/${vendorId}/performance`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching performance reviews:', error);
        throw error;
    }
}

async function addPerformanceReview(vendorId, reviewData) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/profiles/${vendorId}/performance`, {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error adding performance review:', error);
        throw error;
    }
}

// Page-Specific Initialization
function initializePage() {
    const path = window.location.pathname.split('/').pop();
    
    // Update auth UI on all pages
    updateAuthUI();
    
    // Initialize page-specific functionality
    switch(path) {
        case 'index.html':
            initializeHomePage();
            break;
        case 'vendor-management.html':
            initializeVendorManagementPage();
            break;
        case 'vendor-profiles.html':
            initializeVendorProfilesPage();
            break;
        case 'contract-management.html':
            initializeContractManagementPage();
            break;
        case 'analytics.html':
            initializeAnalyticsPage();
            break;
    }
}

// Home Page
function initializeHomePage() {
    // Initialize slider
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.control-dot');
    const totalSlides = slides.length;

    function showSlide(index) {
        if (index >= totalSlides) {
            currentSlide = 0;
        } else if (index < 0) {
            currentSlide = totalSlides - 1;
        } else {
            currentSlide = index;
        }

        const slider = document.querySelector('.slider');
        slider.style.transform = `translateX(-${currentSlide * 100}%)`;

        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }

    // Auto slide change
    setInterval(() => {
        showSlide(currentSlide + 1);
    }, 5000);

    // Dot click events
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            showSlide(i);
        });
    });
}

// Vendor Management Page
function initializeVendorManagementPage() {
    const vendorForm = document.querySelector('.management-card form');
    const vendorList = document.querySelector('.vendor-list');
    const searchInput = document.querySelector('.search-input');
    const filterSelect = document.querySelector('.filter-select');

    // Load vendors on page load
    loadVendors();

    // Form submission
    vendorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const vendorData = {
            name: document.getElementById('vendor-name').value,
            business_id: document.getElementById('business-id').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            category: document.getElementById('category').value
        };
        
        try {
            await createVendor(vendorData);
            vendorForm.reset();
            loadVendors();
            alert('Vendor created successfully!');
        } catch (error) {
            alert(`Error creating vendor: ${error.message}`);
        }
    });

    // Search and filter
    searchInput.addEventListener('input', loadVendors);
    filterSelect.addEventListener('change', loadVendors);

    async function loadVendors() {
        try {
            const category = filterSelect.value;
            const searchTerm = searchInput.value.toLowerCase();
            
            const vendors = await fetchVendors(category);
            
            vendorList.innerHTML = '';
            
            vendors.forEach(vendor => {
                if (searchTerm && !vendor.name.toLowerCase().includes(searchTerm)) {
                    return;
                }
                
                const vendorItem = document.createElement('div');
                vendorItem.className = 'vendor-item';
                vendorItem.innerHTML = `
                    <div class="vendor-info">
                        <h4>${vendor.name}</h4>
                        <p><i class="fas fa-tag"></i> ${vendor.category || 'No category'}</p>
                        <p><i class="fas fa-envelope"></i> ${vendor.email || 'No email'}</p>
                        <p><i class="fas fa-phone"></i> ${vendor.phone || 'No phone'}</p>
                    </div>
                    <div class="vendor-actions">
                        <button class="action-btn edit-btn" data-id="${vendor.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="action-btn delete-btn" data-id="${vendor.id}"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                `;
                
                vendorList.appendChild(vendorItem);
            });
            
            // Add event listeners to edit and delete buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => editVendor(e.target.dataset.id));
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => deleteVendorHandler(e.target.dataset.id));
            });
        } catch (error) {
            console.error('Error loading vendors:', error);
            alert('Failed to load vendors. Please try again.');
        }
    }
    
    async function editVendor(vendorId) {
        try {
            const vendor = await fetchVendors().then(vendors => 
                vendors.find(v => v.id === parseInt(vendorId))
            
            if (vendor) {
                document.getElementById('vendor-name').value = vendor.name;
                document.getElementById('business-id').value = vendor.business_id;
                document.getElementById('phone').value = vendor.phone;
                document.getElementById('email').value = vendor.email;
                document.getElementById('address').value = vendor.address;
                document.getElementById('category').value = vendor.category;
                
                // Change form to update mode
                const form = document.querySelector('.management-card form');
                form.dataset.mode = 'update';
                form.dataset.vendorId = vendorId;
                form.querySelector('.submit-btn').textContent = 'Update Vendor';
                
                // Scroll to form
                form.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error editing vendor:', error);
            alert('Failed to edit vendor. Please try again.');
        }
    }
    
    async function deleteVendorHandler(vendorId) {
        if (confirm('Are you sure you want to delete this vendor?')) {
            try {
                await deleteVendor(vendorId);
                loadVendors();
                alert('Vendor deleted successfully!');
            } catch (error) {
                console.error('Error deleting vendor:', error);
                alert('Failed to delete vendor. Please try again.');
            }
        }
    }
}

// Vendor Profiles Page
function initializeVendorProfilesPage() {
    const profilesGrid = document.querySelector('.profiles-grid');
    const searchInput = document.querySelector('.search-input');
    const filterSelect = document.querySelector('.filter-select');
    const newProfileBtn = document.querySelector('.primary-btn');

    // Load profiles on page load
    loadProfiles();

    // Search and filter
    searchInput.addEventListener('input', loadProfiles);
    filterSelect.addEventListener('change', loadProfiles);

    // New profile button
    newProfileBtn.addEventListener('click', () => {
        // Redirect to vendor management page to add new vendor
        window.location.href = 'vendor-management.html';
    });

    async function loadProfiles() {
        try {
            const category = filterSelect.value;
            const searchTerm = searchInput.value.toLowerCase();
            
            const vendors = await fetchVendors(category);
            
            profilesGrid.innerHTML = '';
            
            vendors.forEach(vendor => {
                if (searchTerm && !vendor.name.toLowerCase().includes(searchTerm)) {
                    return;
                }
                
                // Get initials for avatar
                const initials = vendor.name.split(' ')
                    .map(word => word[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
                
                // Get contract info (simplified - in a real app you'd fetch contracts for each vendor)
                const contractInfo = 'No contract info';
                
                const profileCard = document.createElement('div');
                profileCard.className = 'profile-card';
                profileCard.innerHTML = `
                    <div class="profile-header">
                        <div class="vendor-avatar" style="background-color: ${getRandomColor()};">${initials}</div>
                        <div class="vendor-meta">
                            <h3>${vendor.name}</h3>
                            <span class="vendor-category">${vendor.category || 'No category'}</span>
                        </div>
                    </div>
                    <div class="profile-details">
                        <div class="detail-item">
                            <i class="fas fa-envelope"></i>
                            <span>${vendor.email || 'No email'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-phone"></i>
                            <span>${vendor.phone || 'No phone'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${vendor.address || 'No address'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-file-contract"></i>
                            <span>${contractInfo}</span>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button class="action-btn edit-btn" data-id="${vendor.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="action-btn view-btn" data-id="${vendor.id}"><i class="fas fa-eye"></i> View</button>
                    </div>
                `;
                
                profilesGrid.appendChild(profileCard);
            });
            
            // Add event listeners to buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    window.location.href = `vendor-management.html#edit=${e.target.dataset.id}`;
                });
            });
            
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // In a real app, you might show a detailed view modal
                    alert(`Viewing vendor ${e.target.dataset.id}`);
                });
            });
        } catch (error) {
            console.error('Error loading profiles:', error);
            alert('Failed to load vendor profiles. Please try again.');
        }
    }
    
    function getRandomColor() {
        const colors = ['#ee9e43', '#c9375e', '#4cc9f0', '#560bad', '#993d8b'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// Contract Management Page
function initializeContractManagementPage() {
    const contractList = document.querySelector('.contract-list');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const searchInput = document.querySelector('.search-input');
    const newContractBtn = document.querySelector('.primary-btn');

    // Load contracts on page load
    loadContracts();

    // Filter tabs
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelector('.filter-tab.active').classList.remove('active');
            this.classList.add('active');
            loadContracts(this.textContent.trim().toLowerCase());
        });
    });

    // Search input
    searchInput.addEventListener('input', () => {
        const activeTab = document.querySelector('.filter-tab.active').textContent.trim().toLowerCase();
        loadContracts(activeTab, searchInput.value);
    });

    // New contract button
    newContractBtn.addEventListener('click', () => {
        // In a real app, you'd show a form to create a new contract
        alert('Create new contract functionality would go here');
    });

    async function loadContracts(status = 'all', searchTerm = '') {
        try {
            let contracts = [];
            
            if (status === 'all') {
                contracts = await fetchContracts();
            } else {
                contracts = await fetchContracts(status);
            }
            
            // Filter by search term if provided
            if (searchTerm) {
                searchTerm = searchTerm.toLowerCase();
                contracts = contracts.filter(contract => 
                    contract.title.toLowerCase().includes(searchTerm) ||
                    (contract.description && contract.description.toLowerCase().includes(searchTerm))
            }
            
            renderContracts(contracts);
        } catch (error) {
            console.error('Error loading contracts:', error);
            alert('Failed to load contracts. Please try again.');
        }
    }
    
    function renderContracts(contracts) {
        contractList.innerHTML = '';
        
        contracts.forEach(contract => {
            const vendorName = contract.vendor_id; // In a real app, you'd fetch vendor name
            
            const contractCard = document.createElement('div');
            contractCard.className = `contract-card ${contract.status === 'expiring' ? 'expiring' : ''} ${contract.status === 'expired' ? 'expired' : ''}`;
            contractCard.innerHTML = `
                <div class="contract-header">
                    <h3 class="contract-title">${contract.title}</h3>
                    <span class="contract-status status-${contract.status}">${contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}</span>
                </div>
                <div class="contract-details">
                    <div class="contract-detail">
                        <div class="detail-label">Vendor</div>
                        <div class="detail-value">${vendorName}</div>
                    </div>
                    <div class="contract-detail">
                        <div class="detail-label">Start Date</div>
                        <div class="detail-value">${contract.start_date}</div>
                    </div>
                    <div class="contract-detail">
                        <div class="detail-label">End Date</div>
                        <div class="detail-value">${contract.end_date}</div>
                    </div>
                    <div class="contract-detail">
                        <div class="detail-label">Value</div>
                        <div class="detail-value">${contract.value ? '$' + contract.value.toLocaleString() : 'N/A'}</div>
                    </div>
                </div>
                <div class="contract-actions">
                    <button class="action-btn edit-btn" data-id="${contract.id}"><i class="fas fa-sync-alt"></i> Renew</button>
                    <button class="action-btn view-btn" data-id="${contract.id}"><i class="fas fa-eye"></i> View</button>
                    <button class="action-btn download-btn" data-id="${contract.id}"><i class="fas fa-download"></i> Download</button>
                </div>
            `;
            
            contractList.appendChild(contractCard);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // In a real app, you'd show a form to renew the contract
                alert(`Renew contract ${e.target.dataset.id}`);
            });
        });
        
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // In a real app, you'd show a detailed view of the contract
                alert(`View contract ${e.target.dataset.id}`);
            });
        });
        
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // In a real app, you'd download the contract PDF
                alert(`Download contract ${e.target.dataset.id}`);
            });
        });
    }
}

// Analytics Page
function initializeAnalyticsPage() {
    // Load analytics data on page load
    loadAnalyticsData();

    async function loadAnalyticsData() {
        try {
            // Fetch all analytics data in parallel
            const [
                summary, 
                vendorsByCategory, 
                spendingByVendor, 
                contractStatus,
                vendorPerformance,
                topVendors
            ] = await Promise.all([
                fetchAnalyticsSummary(),
                fetchVendorsByCategory(),
                fetchSpendingByVendor(),
                fetchContractStatus(),
                fetchVendorPerformance(),
                fetchTopPerformingVendors()
            ]);
            
            // Update summary metrics
            document.querySelector('.metric-value:nth-child(1)').textContent = summary.active_vendors;
            document.querySelector('.metric-value:nth-child(2)').textContent = `$${(summary.total_contract_value || 0).toLocaleString()}`;
            document.querySelector('.metric-value:nth-child(3)').textContent = summary.expiring_soon;
            document.querySelector('.metric-value:nth-child(4)').textContent = summary.average_rating;
            
            // Render charts (using Chart.js which is included in analytics.html)
            renderCharts(vendorsByCategory, spendingByVendor, contractStatus, vendorPerformance);
            
            // Render top vendors table
            renderTopVendorsTable(topVendors);
        } catch (error) {
            console.error('Error loading analytics data:', error);
            alert('Failed to load analytics data. Please try again.');
        }
    }
    
    function renderCharts(vendorsByCategory, spendingByVendor, contractStatus, vendorPerformance) {
        // Vendors by Category Chart
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: vendorsByCategory.map(item => item.category || 'Unknown'),
                datasets: [{
                    data: vendorsByCategory.map(item => item.count),
                    backgroundColor: [
                        '#ee9e43',
                        '#c9375e',
                        '#993d8b',
                        '#4cc9f0',
                        '#560bad'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });

        // Spending by Vendor Chart
        const spendingCtx = document.getElementById('spendingChart').getContext('2d');
        new Chart(spendingCtx, {
            type: 'bar',
            data: {
                labels: spendingByVendor.map(item => item.vendor),
                datasets: [{
                    label: 'Contract Value ($)',
                    data: spendingByVendor.map(item => item.total),
                    backgroundColor: '#4cc9f0',
                    borderColor: '#3a7bd5',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Contract Status Chart
        const statusCtx = document.getElementById('statusChart').getContext('2d');
        new Chart(statusCtx, {
            type: 'pie',
            data: {
                labels: contractStatus.map(item => item.status.charAt(0).toUpperCase() + item.status.slice(1)),
                datasets: [{
                    data: contractStatus.map(item => item.count),
                    backgroundColor: [
                        '#4cc9f0',
                        '#ffcc00',
                        '#f72585'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });

        // Vendor Performance Chart
        const performanceCtx = document.getElementById('performanceChart').getContext('2d');
        new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: vendorPerformance.map(item => item.month),
                datasets: [{
                    label: 'Average Vendor Rating',
                    data: vendorPerformance.map(item => item.average_rating),
                    fill: false,
                    backgroundColor: '#993d8b',
                    borderColor: '#993d8b',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        min: 3,
                        max: 5
                    }
                }
            }
        });
    }
    
    function renderTopVendorsTable(topVendors) {
        const tableBody = document.querySelector('.vendor-table tbody');
        tableBody.innerHTML = '';
        
        topVendors.forEach(vendor => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${vendor.name}</td>
                <td>${vendor.category}</td>
                <td>$${(vendor.total_contract_value || 0).toLocaleString()}</td>
                <td>${vendor.average_rating}</td>
                <td><span class="status-badge active">Active</span></td>
            `;
            tableBody.appendChild(row);
        });
    }
}

// Initialize the current page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);