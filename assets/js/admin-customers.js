/**
 * Admin Customers Management
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Load customers list
    await loadCustomers();

    // Setup filters
    setupFilters();

    // Setup search
    setupSearch();
});

let currentFilters = {
    sort: 'newest',
    page: 1,
    search: ''
};

let currentCustomerDetail = null;

/**
 * Load customers list
 */
async function loadCustomers(filters = {}) {
    try {
        currentFilters = { ...currentFilters, ...filters };
        
        const params = new URLSearchParams({
            page: currentFilters.page || 1,
            limit: 20
        });
        
        if (currentFilters.sort) {
            params.append('sort', currentFilters.sort);
        }
        
        if (currentFilters.search) {
            params.append('search', currentFilters.search);
        }
        
        const response = await fetch(`/api/admin/customers/list.php?${params.toString()}`, {
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderCustomers(result.data.customers);
            renderPagination(result.data.pagination);
        } else {
            showNotification('Không thể tải danh sách khách hàng: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Failed to load customers:', error);
        showNotification('Không thể tải danh sách khách hàng', 'error');
    }
}

/**
 * Render customers table
 */
function renderCustomers(customers) {
    const tbody = document.querySelector('.admin-table tbody');
    
    if (!tbody) return;
    
    if (!customers || customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    Chưa có khách hàng nào
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = customers.map(customer => `
        <tr data-customer-id="${customer.id}">
            <td>
                <div><strong>${customer.full_name || 'N/A'}</strong></div>
                <div style="font-size: 0.85rem; color: var(--text-gray);">
                    Thành viên từ ${formatDate(customer.created_at)}
                </div>
            </td>
            <td>
                <div>${customer.email || 'N/A'}</div>
                <div style="font-size: 0.85rem; color: var(--text-gray);">
                    ${customer.phone || 'N/A'}
                </div>
            </td>
            <td><strong>${customer.total_orders} đơn</strong></td>
            <td><strong>${formatPrice(customer.total_spent)}</strong></td>
            <td>
                <span class="admin-badge ${getStatusClass(customer.status)}">
                    ${customer.points || 0} điểm
                </span>
            </td>
            <td>
                <span class="admin-badge ${customer.status === 'active' ? 'confirmed' : 'canceled'}">
                    ${getStatusLabel(customer.status)}
                </span>
            </td>
            <td>
                <div class="admin-action-buttons">
                    <button class="admin-btn-icon" title="Xem chi tiết" onclick="openCustomerDetail(${customer.id})">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                    </button>
                    <button class="admin-btn-icon" 
                            title="${customer.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}" 
                            onclick="toggleCustomerStatus(${customer.id}, '${customer.status === 'active' ? 'suspended' : 'active'}')">
                        ${customer.status === 'active' ? '🔒' : '🔓'}
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Open customer detail modal
 */
async function openCustomerDetail(customerId) {
    const modal = document.getElementById('customerDetailModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    await loadCustomerDetail(customerId);
}

/**
 * Load customer detail
 */
async function loadCustomerDetail(customerId) {
    try {
        const response = await fetch(`/api/admin/customers/detail.php?id=${customerId}`, {
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentCustomerDetail = result.data.customer;
            renderCustomerDetail(result.data.customer);
        } else {
            showNotification('Không thể tải chi tiết khách hàng', 'error');
        }
        
    } catch (error) {
        console.error('Failed to load customer detail:', error);
        showNotification('Không thể tải chi tiết khách hàng', 'error');
    }
}

/**
 * Render customer detail
 */
function renderCustomerDetail(customer) {
    // Personal info
    document.getElementById('customerName').textContent = customer.full_name || 'N/A';
    document.getElementById('customerEmail').textContent = customer.email || 'N/A';
    document.getElementById('customerPhone').textContent = customer.phone || 'N/A';
    document.getElementById('customerJoinDate').textContent = formatDate(customer.created_at);
    document.getElementById('customerStatus').innerHTML = `
        <span class="admin-badge ${customer.status === 'active' ? 'confirmed' : 'canceled'}">
            ${getStatusLabel(customer.status)}
        </span>
    `;
    
    // Points
    document.getElementById('customerPoints').textContent = `${customer.points || 0} điểm`;
    
    // Orders
    const ordersList = document.getElementById('customerOrdersList');
    if (ordersList && customer.orders) {
        if (customer.orders.length === 0) {
            ordersList.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem;">
                        Khách hàng chưa có đơn hàng nào
                    </td>
                </tr>
            `;
        } else {
            ordersList.innerHTML = customer.orders.map(order => `
                <tr>
                    <td>#${order.order_number}</td>
                    <td>${formatDateTime(order.created_at)}</td>
                    <td>Đơn hàng #${order.order_number}</td>
                    <td>${formatPrice(order.total)}</td>
                    <td>
                        <span class="admin-badge ${getStatusClass(order.status)}">
                            ${getStatusLabel(order.status)}
                        </span>
                    </td>
                    <td>
                        <button class="admin-btn-icon" onclick="openOrderDetail(${order.id})">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }
    
    // Stats - Update stats if elements exist
    const statsElements = {
        'total_orders': customer.total_orders || 0,
        'total_spent': formatPrice(customer.total_spent || 0),
        'avg_order_value': formatPrice(customer.avg_order_value || 0),
        'completed_orders': customer.completed_orders || 0,
        'processing_orders': customer.processing_orders || 0,
        'completion_rate': customer.completion_rate || 0
    };
    
    // Update stats if elements exist (assuming they're in the modal)
    // These will be updated if the HTML has elements with these IDs
}

/**
 * Close customer detail modal
 */
function closeCustomerDetail() {
    const modal = document.getElementById('customerDetailModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentCustomerDetail = null;
}

/**
 * Toggle customer status
 */
async function toggleCustomerStatus(customerId, newStatus) {
    const action = newStatus === 'active' ? 'mở khóa' : 'khóa';
    if (!confirm(`Xác nhận ${action} tài khoản khách hàng?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/admin/customers/update-status.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                customer_id: customerId,
                status: newStatus
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Đã ${action} tài khoản khách hàng thành công!`, 'success');
            await loadCustomers();
            
            // Update modal if open
            if (currentCustomerDetail && currentCustomerDetail.id === customerId) {
                await loadCustomerDetail(customerId);
            }
        } else {
            showNotification('Cập nhật thất bại: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Failed to update customer status:', error);
        showNotification('Cập nhật thất bại', 'error');
    }
}

/**
 * Adjust customer points (placeholder)
 */
function adjustCustomerPoints() {
    if (!currentCustomerDetail) return;
    
    const points = prompt('Nhập số điểm muốn điều chỉnh (số dương để cộng, số âm để trừ):');
    if (points !== null && !isNaN(points)) {
        const newPoints = (currentCustomerDetail.points || 0) + parseInt(points);
        showNotification(`Đã điều chỉnh điểm thưởng ${points > 0 ? '+' : ''}${points} điểm! Tổng điểm mới: ${newPoints}`, 'success');
        // TODO: Implement API to adjust points
    }
}

/**
 * Setup filters
 */
function setupFilters() {
    const sortFilter = document.querySelector('.admin-filter-bar select');
    
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            loadCustomers({ sort: this.value, page: 1 });
        });
    }
}

/**
 * Setup search
 */
function setupSearch() {
    const searchInput = document.querySelector('.admin-search-box input');
    
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadCustomers({ search: this.value, page: 1 });
            }, 500);
        });
    }
}

/**
 * Render pagination
 */
function renderPagination(pagination) {
    const paginationContainer = document.querySelector('.admin-pagination');
    if (!paginationContainer || !pagination) return;
    
    const { current_page, total_pages, has_prev, has_next } = pagination;
    
    paginationContainer.innerHTML = `
        <button class="admin-page-btn" ${!has_prev ? 'disabled' : ''} onclick="loadCustomers({ page: ${current_page - 1} })">
            ‹ Trước
        </button>
        ${Array.from({ length: Math.min(5, total_pages) }, (_, i) => {
            const page = i + 1;
            return `<button class="admin-page-btn ${page === current_page ? 'active' : ''}" onclick="loadCustomers({ page: ${page} })">${page}</button>`;
        }).join('')}
        <button class="admin-page-btn" ${!has_next ? 'disabled' : ''} onclick="loadCustomers({ page: ${current_page + 1} })">
            Sau ›
        </button>
    `;
}

/**
 * Helper functions
 */
function formatPrice(price) {
    if (!price) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusClass(status) {
    const classes = {
        'active': 'success',
        'suspended': 'warning',
        'banned': 'danger',
        'pending': 'warning',
        'confirmed': 'info',
        'processing': 'info',
        'shipping': 'primary',
        'delivered': 'success',
        'cancelled': 'danger'
    };
    return classes[status] || 'secondary';
}

function getStatusLabel(status) {
    const labels = {
        'active': 'Hoạt động',
        'suspended': 'Đã khóa',
        'banned': 'Đã cấm',
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'processing': 'Đang xử lý',
        'shipping': 'Đang giao',
        'delivered': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return labels[status] || status;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `admin-notification admin-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Make functions global for onclick handlers
window.openCustomerDetail = openCustomerDetail;
window.closeCustomerDetail = closeCustomerDetail;
window.toggleCustomerStatus = toggleCustomerStatus;
window.adjustCustomerPoints = adjustCustomerPoints;
window.loadCustomers = loadCustomers;

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('customerDetailModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeCustomerDetail();
            }
        });
    }
});

// Helper function to open order detail (if exists)
function openOrderDetail(orderId) {
    // If order detail modal exists, open it
    if (window.openOrderDetail) {
        window.openOrderDetail(orderId);
    } else {
        // Otherwise, open in new window or redirect
        window.open(`orders.html#order-${orderId}`, '_blank');
    }
}

