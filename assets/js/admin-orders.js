/**
 * Admin Orders Management
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Load orders list
    await loadOrders();

    // Setup filters
    setupFilters();

    // Setup search
    setupSearch();
});

let currentFilters = {
    status: '',
    time: '',
    sort: 'newest',
    page: 1
};

let currentOrderDetail = null;

/**
 * Load orders list
 */
async function loadOrders(filters = {}) {
    try {
        currentFilters = { ...currentFilters, ...filters };
        
        const params = new URLSearchParams({
            page: currentFilters.page || 1,
            limit: 20
        });
        
        if (currentFilters.status) {
            params.append('status', currentFilters.status);
        }
        
        const response = await fetch(`/api/orders/list.php?${params.toString()}`, {
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderOrders(result.data.orders);
            renderPagination(result.data.pagination);
        } else {
            showNotification('Không thể tải danh sách đơn hàng: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Failed to load orders:', error);
        showNotification('Không thể tải danh sách đơn hàng', 'error');
    }
}

/**
 * Render orders table
 */
function renderOrders(orders) {
    const tbody = document.querySelector('.admin-table tbody');
    
    if (!tbody) return;
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    Chưa có đơn hàng nào
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr data-order-id="${order.id}">
            <td><strong>#${order.order_number}</strong></td>
            <td>
                <div>${order.guest_name || order.shipping_name || 'N/A'}</div>
                <div style="font-size: 0.85rem; color: var(--text-gray);">
                    ${order.guest_phone || order.shipping_phone || 'N/A'}
                </div>
            </td>
            <td>
                <div>${order.items_count || 'Nhiều'} sản phẩm</div>
            </td>
            <td><strong>${formatPrice(order.total)}</strong></td>
            <td>${formatDateTime(order.created_at)}</td>
            <td>
                <span class="admin-badge ${getStatusClass(order.status)}">
                    ${getStatusLabel(order.status)}
                </span>
            </td>
            <td>
                <div class="admin-action-buttons">
                    ${getActionButtons(order.status, order.id)}
                    <button class="admin-btn-icon" title="Xem chi tiết" onclick="openOrderDetail(${order.id})">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Get action buttons based on order status
 */
function getActionButtons(status, orderId) {
    const buttons = {
        'pending': `<button class="admin-btn-small" onclick="updateOrderStatus(${orderId}, 'confirmed')">Xác nhận</button>`,
        'confirmed': `<button class="admin-btn-small" onclick="updateOrderStatus(${orderId}, 'shipping')">Giao hàng</button>`,
        'shipping': `<button class="admin-btn-small" onclick="updateOrderStatus(${orderId}, 'delivered')">Hoàn thành</button>`,
        'delivered': '',
        'cancelled': ''
    };
    
    return buttons[status] || '';
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, newStatus) {
    if (!confirm(`Xác nhận cập nhật trạng thái đơn hàng?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/admin/orders/update-status.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                order_id: orderId,
                status: newStatus
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Cập nhật trạng thái đơn hàng thành công!', 'success');
            await loadOrders();
            
            // Update modal if open
            if (currentOrderDetail && currentOrderDetail.id === orderId) {
                await loadOrderDetail(orderId);
            }
        } else {
            showNotification('Cập nhật thất bại: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Failed to update order status:', error);
        showNotification('Cập nhật thất bại', 'error');
    }
}

/**
 * Open order detail modal
 */
async function openOrderDetail(orderId) {
    const modal = document.getElementById('orderDetailModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    await loadOrderDetail(orderId);
}

/**
 * Load order detail
 */
async function loadOrderDetail(orderId) {
    try {
        const response = await fetch(`/api/orders/detail.php?id=${orderId}`, {
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentOrderDetail = result.data.order;
            renderOrderDetail(result.data.order);
        } else {
            showNotification('Không thể tải chi tiết đơn hàng', 'error');
        }
        
    } catch (error) {
        console.error('Failed to load order detail:', error);
        showNotification('Không thể tải chi tiết đơn hàng', 'error');
    }
}

/**
 * Render order detail
 */
function renderOrderDetail(order) {
    // Order ID
    document.getElementById('orderDetailId').textContent = `#${order.order_number}`;
    
    // Customer info
    document.getElementById('orderCustomerName').textContent = order.guest_name || order.shipping_name || 'N/A';
    document.getElementById('orderCustomerPhone').textContent = order.guest_phone || order.shipping_phone || 'N/A';
    document.getElementById('orderCustomerEmail').textContent = order.guest_email || 'N/A';
    
    // Shipping address
    document.getElementById('orderAddress').textContent = order.shipping_address || 'N/A';
    document.getElementById('orderNote').textContent = order.shipping_note || 'Không có ghi chú';
    
    // Products
    const productsList = document.getElementById('orderProductsList');
    if (productsList && order.items) {
        productsList.innerHTML = order.items.map(item => `
            <tr>
                <td>${item.product_name || 'N/A'}</td>
                <td>${item.variant || item.product_variant || 'N/A'}</td>
                <td>${item.quantity}</td>
                <td>${formatPrice(item.product_price)}</td>
                <td>${formatPrice(item.subtotal)}</td>
            </tr>
        `).join('');
    }
    
    // Summary
    document.getElementById('orderSubtotal').textContent = formatPrice(order.subtotal);
    document.getElementById('orderShipping').textContent = formatPrice(order.shipping_fee);
    document.getElementById('orderDiscount').textContent = '-' + formatPrice(order.discount);
    document.getElementById('orderTotal').innerHTML = `<strong>${formatPrice(order.total)}</strong>`;
    
    // Status select
    const statusSelect = document.getElementById('orderStatusSelect');
    if (statusSelect) {
        statusSelect.value = order.status;
    }
}

/**
 * Close order detail modal
 */
function closeOrderDetail() {
    const modal = document.getElementById('orderDetailModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentOrderDetail = null;
}

/**
 * Update order status from detail modal
 */
function updateOrderStatusFromDetail() {
    if (!currentOrderDetail) return;
    
    const statusSelect = document.getElementById('orderStatusSelect');
    if (!statusSelect) return;
    
    const newStatus = statusSelect.value;
    updateOrderStatus(currentOrderDetail.id, newStatus);
}

/**
 * Setup filters
 */
function setupFilters() {
    const statusFilter = document.querySelector('.admin-filter-bar select');
    const timeFilter = document.querySelectorAll('.admin-filter-bar select')[1];
    const sortFilter = document.querySelectorAll('.admin-filter-bar select')[2];
    
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            loadOrders({ status: this.value, page: 1 });
        });
    }
    
    if (timeFilter) {
        timeFilter.addEventListener('change', function() {
            // TODO: Implement time filter
            loadOrders({ time: this.value, page: 1 });
        });
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            // TODO: Implement sort
            loadOrders({ sort: this.value, page: 1 });
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
                // TODO: Implement search
                console.log('Search:', this.value);
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
        <button class="admin-page-btn" ${!has_prev ? 'disabled' : ''} onclick="loadOrders({ page: ${current_page - 1} })">
            ‹ Trước
        </button>
        ${Array.from({ length: Math.min(5, total_pages) }, (_, i) => {
            const page = i + 1;
            return `<button class="admin-page-btn ${page === current_page ? 'active' : ''}" onclick="loadOrders({ page: ${page} })">${page}</button>`;
        }).join('')}
        <button class="admin-page-btn" ${!has_next ? 'disabled' : ''} onclick="loadOrders({ page: ${current_page + 1} })">
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
window.updateOrderStatus = updateOrderStatus;
window.openOrderDetail = openOrderDetail;
window.closeOrderDetail = closeOrderDetail;
window.updateOrderStatusFromDetail = updateOrderStatusFromDetail;

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('orderDetailModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeOrderDetail();
            }
        });
    }
});

