/**
 * Admin Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Load dashboard stats with default period 'day' (today)
    await loadDashboardStats('day');

    // Setup period filter
    setupPeriodFilter();

    // Refresh every 5 minutes
    setInterval(async () => {
        // Get current active period
        const activeBtn = document.querySelector('.admin-time-filter .admin-filter-btn.active');
        const period = activeBtn ? (activeBtn.dataset.period || 'day') : 'day';
        await loadDashboardStats(period);
    }, 5 * 60 * 1000);
});

/**
 * Load dashboard statistics
 */
async function loadDashboardStats(period = 'day') {
    try {
        // Map button period to API period
        const periodMap = {
            'day': 'today',
            'week': 'week',
            'month': 'month'
        };
        const apiPeriod = periodMap[period] || period || 'today';
        
        const response = await fetch(`/api/admin/dashboard/stats.php?period=${apiPeriod}`, {
            credentials: 'same-origin'
        });
        
        const result = await response.json();

        if (result.success) {
            updateDashboardUI(result.data);
        } else {
            console.error('Failed to load stats:', result.message);
            showNotification('Không thể tải thống kê: ' + result.message, 'error');
        }

    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        showNotification('Không thể tải thống kê', 'error');
    }
}

/**
 * Update dashboard UI
 */
function updateDashboardUI(data) {
    // Update stat cards
    updateStatCard('total-revenue', data.total_revenue, formatPrice);
    updateStatCard('total-orders', data.total_orders);
    updateStatCard('total-products', data.total_products);
    updateStatCard('total-customers', data.total_customers);
    
    // Update orders by status
    if (data.orders_by_status) {
        updateOrdersByStatus(data.orders_by_status);
    }

    // Update best selling products
    if (data.best_selling_products) {
        updateBestSelling(data.best_selling_products);
    }

    // Update recent orders
    if (data.recent_orders) {
        updateRecentOrders(data.recent_orders);
    }

    // Update revenue chart
    if (data.chart_data) {
        updateRevenueChart(data.chart_data);
    }
    
    // Update revenue by category
    if (data.revenue_by_category) {
        updateRevenueByCategory(data.revenue_by_category);
    }
}

/**
 * Update stat card
 */
function updateStatCard(id, value, formatter = null) {
    // Try multiple selectors
    const selectors = [
        `[data-stat="${id}"]`,
        `#${id}-value`,
        `.stat-${id} .stat-value`
    ];
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = formatter ? formatter(value) : value;
            break;
        }
    }
    
    // Special handling for revenue value
    if (id === 'total-revenue') {
        const revenueValue = document.getElementById('revenue-value');
        if (revenueValue) {
            revenueValue.textContent = formatter ? formatter(value) : value;
        }
    }
    
    // Special handling for orders value
    if (id === 'total-orders') {
        const ordersValue = document.getElementById('orders-value');
        if (ordersValue) {
            ordersValue.textContent = value || 0;
        }
    }
    
    // Special handling for products value
    if (id === 'total-products') {
        const productsValue = document.getElementById('products-value');
        if (productsValue) {
            productsValue.textContent = value || 0;
        }
    }
    
    // Special handling for customers value
    if (id === 'total-customers') {
        const customersValue = document.getElementById('customers-value');
        if (customersValue) {
            customersValue.textContent = formatNumber(value || 0);
        }
    }
}

/**
 * Update orders by status
 */
function updateOrdersByStatus(ordersByStatus) {
    const container = document.getElementById('orders-by-status');
    
    if (!container) return;

    const statusLabels = {
        'pending': 'Chờ',
        'confirmed': 'Xác nhận',
        'processing': 'Đang xử lý',
        'shipping': 'Đang giao',
        'delivered': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    
    const statusColors = {
        'pending': { bg: 'rgba(253, 203, 110, 0.15)', color: '#d68910' },
        'confirmed': { bg: 'rgba(116, 185, 255, 0.15)', color: '#2874a6' },
        'processing': { bg: 'rgba(116, 185, 255, 0.15)', color: '#2874a6' },
        'shipping': { bg: 'rgba(116, 185, 255, 0.15)', color: '#2874a6' },
        'delivered': { bg: 'rgba(0, 184, 148, 0.15)', color: '#239954' },
        'cancelled': { bg: 'rgba(231, 76, 60, 0.15)', color: '#c0392b' }
    };

    // Build status map
    const statusMap = {};
    ordersByStatus.forEach(item => {
        statusMap[item.status] = item.count;
    });

    container.innerHTML = ['pending', 'confirmed', 'shipping', 'delivered'].map(status => {
        const count = statusMap[status] || 0;
        const colors = statusColors[status] || { bg: 'rgba(0,0,0,0.1)', color: '#666' };
        const label = statusLabels[status] || status;
        
        return `<span class="admin-status-badge" style="background: ${colors.bg}; color: ${colors.color};">${label}: ${count}</span>`;
    }).join('');
}

/**
 * Update best selling products
 */
function updateBestSelling(products) {
    const container = document.getElementById('best-selling-products');
    
    if (!container) return;
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-gray);">
                Chưa có sản phẩm bán chạy
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const revenue = (product.price || 0) * (product.sales_count || 0);
        return `
            <div class="admin-list-item">
                <div class="admin-product-info">
                    <div class="admin-product-image" style="background: linear-gradient(135deg, #ffe0b2, #ffccbc); ${product.image_url ? `background-image: url('${product.image_url}'); background-size: cover; background-position: center;` : ''}"></div>
                    <div>
                        <h4>${product.name || 'N/A'}</h4>
                        <p>Đã bán: ${product.sales_count || 0}</p>
                    </div>
                </div>
                <span class="admin-product-revenue">${formatPrice(revenue)}</span>
            </div>
        `;
    }).join('');
}

/**
 * Update recent orders
 */
function updateRecentOrders(orders) {
    const tbody = document.getElementById('recent-orders-table');
    
    if (!tbody) return;
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-gray);">
                    Chưa có đơn hàng nào
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>#${order.order_number || order.id}</strong></td>
            <td>${order.guest_name || order.shipping_name || 'N/A'}</td>
            <td>Đơn hàng #${order.order_number || order.id}</td>
            <td><strong>${formatPrice(order.total)}</strong></td>
            <td>
                <span class="admin-badge ${getStatusClass(order.status)}">
                    ${getStatusLabel(order.status)}
                </span>
            </td>
            <td>
                <a href="orders.html" class="admin-btn-small" onclick="if(window.openOrderDetail){event.preventDefault();window.openOrderDetail(${order.id});}">Xem</a>
            </td>
        </tr>
    `).join('');
}

/**
 * Update revenue chart
 */
function updateRevenueChart(chartData) {
    const container = document.getElementById('revenue-chart');
    
    if (!container) return;
    
    if (!chartData || chartData.length === 0) {
        container.innerHTML = `
            <svg viewBox="0 0 24 24" width="64" height="64" style="opacity: 0.3; margin-bottom: 16px;"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/></svg>
            <p style="font-size: 1rem; font-weight: 600; color: var(--admin-text); margin: 0 0 8px 0;">Chưa có dữ liệu doanh thu</p>
            <p style="color: var(--admin-text-gray); font-size: 0.875rem; margin: 0;">Doanh thu 7 ngày gần đây</p>
        `;
        return;
    }

    // Simple text-based chart for now
    // You can integrate Chart.js or other charting library here
    const maxRevenue = Math.max(...chartData.map(item => item.revenue), 1);
    
    container.innerHTML = `
        <div class="chart-data-list" style="padding: 1rem;">
            ${chartData.map(item => {
                const barWidth = (item.revenue / maxRevenue) * 100;
                return `
                    <div style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="font-weight: 600;">${formatDate(item.date)}</span>
                            <span style="color: var(--admin-accent); font-weight: 600;">${formatPrice(item.revenue)}</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: rgba(232, 213, 183, 0.2); border-radius: 4px; overflow: hidden;">
                            <div style="width: ${barWidth}%; height: 100%; background: linear-gradient(90deg, var(--admin-primary), var(--admin-accent)); transition: width 0.3s;"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Update revenue by category
 */
function updateRevenueByCategory(revenueByCategory) {
    if (!revenueByCategory) return;
    
    // Update revenue for each category
    if (revenueByCategory['banh-kem']) {
        const element = document.getElementById('revenue-banh-kem');
        if (element) {
            element.textContent = formatPrice(revenueByCategory['banh-kem']);
        }
    }
    
    if (revenueByCategory['hoa-tuoi']) {
        const element = document.getElementById('revenue-hoa-tuoi');
        if (element) {
            element.textContent = formatPrice(revenueByCategory['hoa-tuoi']);
        }
    }
    
    if (revenueByCategory['combo']) {
        const element = document.getElementById('revenue-combo');
        if (element) {
            element.textContent = formatPrice(revenueByCategory['combo']);
        }
    }
}

/**
 * Setup period filter
 */
function setupPeriodFilter() {
    // Setup period filter buttons
    const periodButtons = document.querySelectorAll('.admin-time-filter .admin-filter-btn');
    
    periodButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            periodButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const period = this.dataset.period || 'today';
            loadDashboardStats(period);
        });
    });
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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

function formatNumber(num) {
    if (!num) return '0';
    return new Intl.NumberFormat('vi-VN').format(num);
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
        'pending': 'Chờ xử lý',
        'confirmed': 'Đã xác nhận',
        'processing': 'Đang xử lý',
        'shipping': 'Đang giao',
        'delivered': 'Đã giao',
        'cancelled': 'Đã hủy'
    };
    return labels[status] || status;
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `admin-notification admin-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

