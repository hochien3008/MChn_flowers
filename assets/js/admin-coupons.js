/**
 * Admin Coupons Management
 * Version: 2.2 - Product Selection with Images and Detail Modal
 * Last Updated: 2025-01-XX
 */

// Functions will be exported after definition below

try {
    console.log('admin-coupons.js script loaded');
    
    // Test if script is working
    if (typeof window !== 'undefined') {
        window.adminCouponsLoaded = true;
        console.log('Window object available, adminCouponsLoaded set to true');
    }
} catch (e) {
    console.error('Error in admin-coupons.js initialization:', e);
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('DOMContentLoaded - Setting up coupon management');
    
    // Load coupons list
    await loadCoupons();

    // Setup filters
    setupFilters();

    // Setup form
    setupCouponForm();
    
    // Setup modal click handlers
    const modal = document.getElementById('couponModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeCouponModal();
            }
        });
    }
    const detailModal = document.getElementById('couponDetailModal');
    if (detailModal) {
        detailModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeCouponDetailModal();
            }
        });
    }
    
    // Setup applyTo select change event - use event delegation since element is in modal
    document.addEventListener('change', function(e) {
        if (e.target && e.target.id === 'applyTo') {
            console.log('applyTo change event fired (via delegation), value:', e.target.value);
            toggleProductSelection();
        }
    });
    
    // Setup product search input in modal - use event delegation
    document.addEventListener('input', function(e) {
        if (e.target && e.target.id === 'productSearchInputModal') {
            clearTimeout(window.productSearchTimeout);
            window.productSearchTimeout = setTimeout(() => {
                filterProducts(e.target.value);
            }, 300);
        }
    });
    
    // Setup product selection modal click outside
    const productModal = document.getElementById('productSelectionModal');
    if (productModal) {
        productModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeProductSelectionModal();
            }
        });
    }
    
    // Setup product detail modal click outside
    const productDetailModal = document.getElementById('productDetailModal');
    if (productDetailModal) {
        productDetailModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeProductDetailModal();
            }
        });
    }
    
    console.log('All event listeners setup complete');
    } catch (e) {
        console.error('Error in DOMContentLoaded:', e);
    }
});

let currentFilters = {
    status: '',
    type: '',
    search: '',
    page: 1
};

let currentCouponId = null;

/**
 * Load coupons list
 */
async function loadCoupons(filters = {}) {
    try {
        currentFilters = { ...currentFilters, ...filters };
        
        const params = new URLSearchParams({
            page: currentFilters.page || 1,
            limit: 20
        });
        
        if (currentFilters.status) {
            params.append('status', currentFilters.status);
        }
        
        if (currentFilters.type) {
            params.append('type', currentFilters.type);
        }
        
        if (currentFilters.search) {
            params.append('search', currentFilters.search);
        }
        
        const response = await fetch(`/api/admin/coupons/list.php?${params.toString()}`, {
            credentials: 'same-origin'
        });
        const responseText = await response.text();
        if (!response.ok) {
            throw new Error('Server error: ' + responseText);
        }
        const result = JSON.parse(responseText);
        
        if (result.success) {
            renderCoupons(result.data.coupons);
            renderPagination(result.data.pagination);
        } else {
            showNotification('Không thể tải danh sách mã giảm giá: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Failed to load coupons:', error);
        showNotification('Không thể tải danh sách mã giảm giá', 'error');
    }
}

async function fetchCouponDetail(couponId) {
    const response = await fetch(`/api/admin/coupons/detail.php?id=${couponId}`, {
        credentials: 'same-origin'
    });
    const responseText = await response.text();
    if (!response.ok) {
        throw new Error(responseText || 'Yêu cầu chi tiết mã giảm giá thất bại');
    }
    let result;
    try {
        result = JSON.parse(responseText);
    } catch (error) {
        throw new Error(responseText || 'Phản hồi chi tiết mã giảm giá không hợp lệ');
    }
    if (!result.success) {
        throw new Error(result.message || 'Không thể tải thông tin mã giảm giá');
    }
    return result.data.coupon;
}

/**
 * Render coupons table
 */
function renderCoupons(coupons) {
    const tbody = document.querySelector('.admin-table tbody');
    
    if (!tbody) return;
    
    if (!coupons || coupons.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" style="text-align: center; padding: 2rem;">
                    Chưa có mã giảm giá nào
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = coupons.map(coupon => {
        const discountValue = coupon.discount_type === 'percentage' 
            ? `${coupon.discount_value}%`
            : formatPrice(coupon.discount_value);
        
        const remaining = coupon.remaining !== null 
            ? coupon.remaining 
            : '∞';
        
        const statusClass = getCouponStatusClass(coupon);
        const statusLabel = getCouponStatusLabel(coupon);
        
        return `
            <tr data-coupon-id="${coupon.id}">
                <td><strong class="admin-coupon-code">${coupon.code}</strong></td>
                <td>
                    <span class="admin-badge ${coupon.discount_type === 'percentage' ? 'confirmed' : 'shipping'}">
                        ${coupon.discount_type === 'percentage' ? 'Phần trăm' : 'Số tiền'}
                    </span>
                </td>
                <td><strong>${discountValue}</strong></td>
                <td>${formatPrice(coupon.min_order)}</td>
                <td>${coupon.usage_limit || '∞'}</td>
                <td>${coupon.used_count}</td>
                <td><strong>${remaining}</strong></td>
                <td>${coupon.valid_from ? formatDateTime(coupon.valid_from) : 'N/A'}</td>
                <td>${coupon.valid_until ? formatDateTime(coupon.valid_until) : 'N/A'}</td>
                <td>Tất cả</td>
                <td>
                    <span class="admin-badge ${statusClass}">${statusLabel}</span>
                </td>
                <td>
                    <div class="admin-action-buttons">
                        <button class="admin-btn-icon" title="Sửa" onclick="editCoupon(${coupon.id})">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="admin-btn-icon" title="Xóa" onclick="deleteCoupon(${coupon.id})">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    attachCouponRowHandlers();
}

function attachCouponRowHandlers() {
    const rows = document.querySelectorAll('.admin-table tbody tr[data-coupon-id]');
    rows.forEach(row => {
        row.addEventListener('click', async function(event) {
            if (event.target.closest('.admin-action-buttons')) {
                return;
            }
            const couponId = this.getAttribute('data-coupon-id');
            if (couponId) {
                await showCouponDetail(couponId);
            }
        });
    });
}

async function showCouponDetail(couponId) {
    try {
        const coupon = await fetchCouponDetail(couponId);
        openCouponDetailModal(coupon);
    } catch (error) {
        console.error('Failed to show coupon detail:', error);
        showNotification(error.message || 'Không thể hiển thị chi tiết mã giảm giá', 'error');
    }
}

function openCouponDetailModal(coupon) {
    const modal = document.getElementById('couponDetailModal');
    if (!modal || !coupon) return;

    const typeLabel = coupon.discount_type === 'percentage' ? 'Phần trăm (%)' : 'Số tiền (₫)';
    const discountValue = coupon.discount_type === 'percentage'
        ? `${coupon.discount_value}%`
        : formatPrice(coupon.discount_value);

    // Tính số lượt còn lại
    const usedCount = coupon.used_count || 0;
    const usageLimit = coupon.usage_limit;
    let remaining;
    if (usageLimit === null || usageLimit === undefined) {
        remaining = '∞';
    } else {
        remaining = Math.max(0, usageLimit - usedCount);
    }

    // Map apply_to to label
    const applyToLabels = {
        'all': 'Tất cả sản phẩm',
        'banh-kem': 'Bánh kem',
        'hoa-tuoi': 'Hoa tươi',
        'combo': 'Combo',
        'qua-tang': 'Quà tặng',
        'specific': 'Sản phẩm cụ thể'
    };
    const applyToLabel = applyToLabels[coupon.apply_to] || coupon.apply_to || 'Tất cả sản phẩm';

    const detailMap = {
        detailCode: coupon.code || '—',
        detailType: typeLabel,
        detailValue: discountValue,
        detailMinOrder: coupon.min_order ? formatPrice(coupon.min_order) : '—',
        detailUsage: usageLimit || '∞',
        detailUsed: usedCount,
        detailRemaining: remaining,
        detailValidFrom: coupon.valid_from ? formatDateTime(coupon.valid_from) : 'N/A',
        detailValidUntil: coupon.valid_until ? formatDateTime(coupon.valid_until) : 'N/A',
        detailApplyTo: applyToLabel,
        detailStatus: getCouponStatusLabel(coupon),
        detailDescription: coupon.description || '—'
    };

    Object.entries(detailMap).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        }
    });

    // Display products list if apply_to is specific
    const productsRow = document.getElementById('detailProductsRow');
    const productsList = document.getElementById('detailProductsList');
    if (coupon.apply_to === 'specific' && coupon.products && coupon.products.length > 0) {
        productsList.innerHTML = coupon.products.map(product => 
            `<div style="padding: 4px 0; border-bottom: 1px solid rgba(0,0,0,0.1);">• ${product.name || 'N/A'}</div>`
        ).join('');
        productsRow.style.display = 'flex';
    } else {
        productsRow.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function closeCouponDetailModal() {
    const modal = document.getElementById('couponDetailModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Open coupon modal
 */
async function editCoupon(couponId) {
    currentCouponId = couponId;

    const row = document.querySelector(`tr[data-coupon-id="${couponId}"]`);
    if (!row) {
        showNotification('Không tìm thấy mã giảm giá', 'error');
        return;
    }

    await loadCouponDetail(couponId);
    openCouponModal(couponId);
    showNotification('Vui lòng cập nhật thông tin mã giảm giá', 'info');
}

function openCouponModal(couponId = null) {
    const modal = document.getElementById('couponModal');
    if (!modal) return;
    
    currentCouponId = couponId;
    const form = document.getElementById('couponForm');
    
    // Show modal first
    modal.style.display = 'flex';
    
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
        if (couponId) {
            // Edit mode - data will be loaded by loadCouponDetail
        } else {
            // Create mode - reset form
            if (form) form.reset();
            updateDiscountInput();
            selectedProducts = [];
            renderSelectedProducts();
            const applyToSelect = document.getElementById('applyTo');
            if (applyToSelect) {
                applyToSelect.value = 'all';
                toggleProductSelection();
            }
            
            // Set default dates
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextMonth = new Date(now);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            
            const startDate = document.getElementById('startDate');
            const endDate = document.getElementById('endDate');
            if (startDate) startDate.value = tomorrow.toISOString().slice(0, 16);
            if (endDate) endDate.value = nextMonth.toISOString().slice(0, 16);
        }
    }, 50);
}

/**
 * Close coupon modal
 */
function closeCouponModal() {
    const modal = document.getElementById('couponModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentCouponId = null;
    selectedProducts = [];
    renderSelectedProducts();
    const form = document.getElementById('couponForm');
    if (form) {
        form.reset();
        document.getElementById('applyTo').value = 'all';
        toggleProductSelection();
    }
}

/**
 * Load coupon detail for editing
 */
async function loadCouponDetail(couponId) {
    try {
        const coupon = await fetchCouponDetail(couponId);
        const form = document.getElementById('couponForm');

        if (!form) return;

        document.getElementById('couponCode').value = coupon.code || '';
        document.getElementById('couponDescription').value = coupon.description || '';
        document.getElementById('discountType').value = coupon.discount_type || 'percentage';
        updateDiscountInput();
        document.getElementById('discountValue').value = coupon.discount_value || '';
        document.getElementById('minOrder').value = coupon.min_order || '';
        document.getElementById('maxUses').value = coupon.usage_limit || '';
        document.getElementById('couponStatus').value = coupon.status || 'active';

        if (coupon.valid_from) {
            document.getElementById('startDate').value = toDatetimeLocal(coupon.valid_from);
        }

        if (coupon.valid_until) {
            document.getElementById('endDate').value = toDatetimeLocal(coupon.valid_until);
        }

        // Load apply_to and products
        const applyTo = coupon.apply_to || 'all';
        document.getElementById('applyTo').value = applyTo;
        
        // Reset selected products first
        selectedProducts = [];
        
        if (applyTo === 'specific') {
            // Show product selection group
            const productSelectionGroup = document.getElementById('productSelectionGroup');
            if (productSelectionGroup) {
                productSelectionGroup.style.display = 'block';
            }
            
            // Set selected products from coupon data
            if (coupon.products && coupon.products.length > 0) {
                selectedProducts = coupon.products.map(p => ({
                    id: p.id,
                    name: p.name
                }));
            } else {
                selectedProducts = [];
            }
            renderSelectedProducts();
        } else {
            const productSelectionGroup = document.getElementById('productSelectionGroup');
            if (productSelectionGroup) {
                productSelectionGroup.style.display = 'none';
            }
            selectedProducts = [];
            renderSelectedProducts();
        }

        return coupon;
    } catch (error) {
        console.error('Failed to load coupon detail:', error);
        showNotification(error.message || 'Không thể lấy thông tin mã giảm giá', 'error');
        return null;
    }
}

function toDatetimeLocal(value) {
    if (!value) return '';
    const date = new Date(value.replace(' ', 'T'));
    if (isNaN(date.getTime())) {
        return '';
    }
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

/**
 * Setup coupon form
 */
function setupCouponForm() {
    const form = document.getElementById('couponForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const applyTo = document.getElementById('applyTo').value;
        const productIds = applyTo === 'specific' ? selectedProducts.map(p => p.id) : [];
        
        // Validate product selection
        if (applyTo === 'specific' && productIds.length === 0) {
            showNotification('Vui lòng chọn ít nhất một sản phẩm', 'error');
            return;
        }
        
        const formData = {
            code: document.getElementById('couponCode').value.toUpperCase().trim(),
            name: document.getElementById('couponCode').value.toUpperCase().trim(), // Using code as name
            description: document.getElementById('couponDescription').value || null,
            discount_type: document.getElementById('discountType').value,
            discount_value: parseFloat(document.getElementById('discountValue').value),
            min_order: parseFloat(document.getElementById('minOrder').value) || 0,
            usage_limit: document.getElementById('maxUses').value ? parseInt(document.getElementById('maxUses').value) : null,
            valid_from: document.getElementById('startDate').value,
            valid_until: document.getElementById('endDate').value,
            status: document.getElementById('couponStatus').value || 'active',
            apply_to: applyTo,
            product_ids: productIds
        };
        
        // Validate
        if (!formData.code || !formData.discount_type || !formData.discount_value) {
            showNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
            return;
        }
        
        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang lưu...';
            
            const endpoint = currentCouponId 
                ? '/api/admin/coupons/update.php'
                : '/api/admin/coupons/create.php';
            
            if (currentCouponId) {
                formData.id = currentCouponId;
            }
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification(currentCouponId ? 'Cập nhật mã giảm giá thành công!' : 'Tạo mã giảm giá thành công!', 'success');
                closeCouponModal();
                await loadCoupons();
            } else {
                throw new Error(result.message || 'Lưu thất bại');
            }
            
        } catch (error) {
            console.error('Failed to save coupon:', error);
            showNotification(error.message || 'Lưu mã giảm giá thất bại', 'error');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Lưu mã giảm giá';
        }
    });
}

/**
 * Edit coupon
 */
/**
 * Copy coupon
 */
/**
 * Delete coupon
 */
async function deleteCoupon(couponId) {
    if (!confirm('Bạn có chắc muốn xóa mã giảm giá này?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/admin/coupons/delete.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
            body: JSON.stringify({ id: couponId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Xóa mã giảm giá thành công!', 'success');
            await loadCoupons();
        } else {
            throw new Error(result.message || 'Xóa thất bại');
        }
        
    } catch (error) {
        console.error('Failed to delete coupon:', error);
        showNotification(error.message || 'Xóa mã giảm giá thất bại', 'error');
    }
}

/**
 * Update discount input based on type
 */
function updateDiscountInput() {
    const type = document.getElementById('discountType').value;
    const input = document.getElementById('discountValue');
    const hint = document.getElementById('discountHint');
    
    if (!input || !hint) return;
    
    if (type === 'percentage') {
        input.setAttribute('max', '100');
        input.setAttribute('step', '1');
        hint.textContent = 'Nhập phần trăm (1-100)';
    } else if (type === 'fixed') {
        input.removeAttribute('max');
        input.setAttribute('step', '1000');
        hint.textContent = 'Nhập số tiền (₫)';
    }
}

/**
 * Setup filters
 */
function setupFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const typeFilter = document.getElementById('typeFilter');
    const searchInput = document.querySelector('.admin-search-input');

    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            loadCoupons({ status: this.value, page: 1 });
        });
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', function() {
            loadCoupons({ type: this.value, page: 1 });
        });
    }

    const performSearch = () => {
        const term = (searchInput?.value || '').trim();
        loadCoupons({ search: term, page: 1 });
    };

    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSearch, 350);
        });
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                clearTimeout(searchTimeout);
                performSearch();
            }
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
        <button class="admin-page-btn" ${!has_prev ? 'disabled' : ''} onclick="loadCoupons({ page: ${current_page - 1} })">
            ‹ Trước
        </button>
        ${Array.from({ length: Math.min(5, total_pages) }, (_, i) => {
            const page = i + 1;
            return `<button class="admin-page-btn ${page === current_page ? 'active' : ''}" onclick="loadCoupons({ page: ${page} })">${page}</button>`;
        }).join('')}
        <button class="admin-page-btn" ${!has_next ? 'disabled' : ''} onclick="loadCoupons({ page: ${current_page + 1} })">
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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCouponStatusClass(coupon) {
    if (coupon.status === 'expired' || (coupon.valid_until && new Date(coupon.valid_until) < new Date())) {
        return 'canceled';
    }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return 'warning';
    }
    if (coupon.status === 'inactive') {
        return 'secondary';
    }
    return 'confirmed';
}

function getCouponStatusLabel(coupon) {
    if (coupon.status === 'expired' || (coupon.valid_until && new Date(coupon.valid_until) < new Date())) {
        return 'Đã hết hạn';
    }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return 'Đã hết lượt';
    }
    if (coupon.status === 'inactive') {
        return 'Tắt';
    }
    return 'Hoạt động';
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

/**
 * Product selection functions
 */
let selectedProducts = [];
let allProducts = [];

function toggleProductSelection() {
    const applyTo = document.getElementById('applyTo');
    const productSelectionGroup = document.getElementById('productSelectionGroup');
    
    if (!applyTo || !productSelectionGroup) {
        return;
    }
    
    if (applyTo.value === 'specific') {
        productSelectionGroup.style.display = 'block';
        renderSelectedProducts(); // Show selected products if any
    } else {
        productSelectionGroup.style.display = 'none';
        selectedProducts = [];
        renderSelectedProducts();
    }
}

// Export IMMEDIATELY after definition
window.toggleProductSelection = toggleProductSelection;

async function loadProductsList() {
    const productsListContainer = document.getElementById('productsList');
    if (!productsListContainer) {
        console.error('productsList container not found');
        return;
    }
    
    productsListContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--admin-text-light);">Đang tải danh sách sản phẩm...</div>';
    
    try {
        // Load all active products
        const response = await fetch(`/api/products/list.php?admin=true&status=active&limit=1000`, {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.products) {
            allProducts = result.data.products;
            renderProductsList(allProducts);
            updateSelectedProductsInModal();
        } else {
            const errorMsg = result.message || 'Không thể tải danh sách sản phẩm';
            productsListContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--admin-text-light);">${errorMsg}</div>`;
        }
    } catch (error) {
        console.error('Failed to load products:', error);
        productsListContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--admin-text-light);">Lỗi khi tải danh sách sản phẩm: ${error.message}</div>`;
    }
}

function renderProductsList(products) {
    const productsListContainer = document.getElementById('productsList');
    
    if (!productsListContainer) {
        return;
    }
    
    if (!products || products.length === 0) {
        productsListContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--admin-text-light);">Không có sản phẩm nào</div>';
        return;
    }
    
    const html = products.map(product => {
        const price = product.sale_price || product.price;
        const finalPrice = product.sale_price || product.price;
        const isSelected = selectedProducts.find(p => p.id === product.id);
        // Escape quotes and special characters for HTML attribute
        const productNameEscaped = (product.name || 'N/A').replace(/'/g, "&#39;").replace(/"/g, "&quot;").replace(/\n/g, " ");
        const imageUrl = product.image_url || (product.image ? `/api/uploads/products/${product.image}` : '/assets/images/no-image.png');
        
        return `
            <div class="admin-product-item">
                <input type="checkbox" 
                       id="product_${product.id}" 
                       ${isSelected ? 'checked' : ''}
                       onclick="event.stopPropagation(); toggleProductCheckbox(${product.id}, '${productNameEscaped}')">
                <img src="${imageUrl}" 
                     alt="${productNameEscaped}" 
                     class="admin-product-item-image"
                     onclick="event.stopPropagation(); showProductDetail(${product.id})"
                     onerror="this.src='/assets/images/no-image.png'">
                <div class="admin-product-item-info" onclick="event.stopPropagation(); showProductDetail(${product.id})">
                    <div class="admin-product-item-name">${product.name || 'N/A'}</div>
                    <div class="admin-product-item-price">
                        ${product.sale_price ? `<span style="text-decoration: line-through; color: var(--admin-text-light); margin-right: 0.5rem;">${formatPrice(product.price)}</span>` : ''}
                        <span style="color: ${product.sale_price ? 'var(--admin-primary)' : 'inherit'};">${formatPrice(finalPrice)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    productsListContainer.innerHTML = html;
}

function toggleProductCheckbox(productId, productNameEscaped) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existingIndex = selectedProducts.findIndex(p => p.id === productId);
    
    if (existingIndex >= 0) {
        // Đã chọn, bỏ chọn
        selectedProducts.splice(existingIndex, 1);
    } else {
        // Chưa chọn, thêm vào
        selectedProducts.push({ id: productId, name: product.name || 'N/A' });
    }
    
    // Cập nhật checkbox
    const checkbox = document.getElementById(`product_${productId}`);
    if (checkbox) {
        checkbox.checked = existingIndex < 0;
    }
    
    updateSelectedProductsInModal();
}

function filterProducts(query) {
    const searchTerm = (query || '').toLowerCase().trim();
    
    if (!searchTerm) {
        renderProductsList(allProducts);
        return;
    }
    
    const filtered = allProducts.filter(product => {
        const name = (product.name || '').toLowerCase();
        return name.includes(searchTerm);
    });
    
    renderProductsList(filtered);
}

function removeSelectedProduct(productId) {
    selectedProducts = selectedProducts.filter(p => p.id !== productId);
    
    // Cập nhật checkbox
    const checkbox = document.getElementById(`product_${productId}`);
    if (checkbox) {
        checkbox.checked = false;
    }
    
    renderSelectedProducts();
}

function renderSelectedProducts() {
    const container = document.getElementById('selectedProductsList');
    if (!container) return;
    
    if (selectedProducts.length === 0) {
        container.innerHTML = '<span style="color: var(--admin-text-light);">Chưa có sản phẩm nào được chọn</span>';
        return;
    }
    
    container.innerHTML = selectedProducts.map(product => `
        <span class="admin-selected-product-tag">
            ${product.name}
            <button type="button" onclick="removeSelectedProduct(${product.id})" title="Xóa">×</button>
        </span>
    `).join('');
}

function updateSelectedProductsInModal() {
    const container = document.getElementById('selectedProductsInModal');
    const countElement = document.getElementById('selectedCount');
    
    if (countElement) {
        countElement.textContent = selectedProducts.length;
    }
    
    if (!container) return;
    
    if (selectedProducts.length === 0) {
        container.innerHTML = '<span style="color: var(--admin-text-light);">Chưa có sản phẩm nào được chọn</span>';
        return;
    }
    
    container.innerHTML = selectedProducts.map(product => `
        <span class="admin-selected-product-tag">
            ${product.name}
            <button type="button" onclick="removeSelectedProductInModal(${product.id})" title="Xóa">×</button>
        </span>
    `).join('');
}

function removeSelectedProductInModal(productId) {
    selectedProducts = selectedProducts.filter(p => p.id !== productId);
    
    // Cập nhật checkbox
    const checkbox = document.getElementById(`product_${productId}`);
    if (checkbox) {
        checkbox.checked = false;
    }
    
    updateSelectedProductsInModal();
}

function openProductSelectionModal() {
    const modal = document.getElementById('productSelectionModal');
    if (!modal) return;
    
    // Reset search input
    const searchInput = document.getElementById('productSearchInputModal');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Show modal
    modal.style.display = 'flex';
    
    // Load products list
    loadProductsList();
}

function closeProductSelectionModal() {
    const modal = document.getElementById('productSelectionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function confirmProductSelection() {
    // Update the selected products display in the form
    renderSelectedProducts();
    // Close modal
    closeProductSelectionModal();
}

async function showProductDetail(productId) {
    const modal = document.getElementById('productDetailModal');
    const content = document.getElementById('productDetailContent');
    const title = document.getElementById('productDetailTitle');
    
    if (!modal || !content) return;
    
    // Show modal with loading state
    modal.style.display = 'flex';
    content.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--admin-text-light);">Đang tải thông tin sản phẩm...</div>';
    
    try {
        const response = await fetch(`/api/products/detail.php?id=${productId}`, {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error('Không thể tải thông tin sản phẩm');
        }
        
        const result = await response.json();
        
        if (!result.success || !result.data || !result.data.product) {
            throw new Error(result.message || 'Không tìm thấy sản phẩm');
        }
        
        const product = result.data.product;
        const imageUrl = product.image_url || (product.image ? `/api/uploads/products/${product.image}` : '/assets/images/no-image.png');
        const finalPrice = product.sale_price || product.price;
        
        title.textContent = product.name || 'Chi tiết sản phẩm';
        
        content.innerHTML = `
            <div>
                <img src="${imageUrl}" 
                     alt="${product.name || 'N/A'}" 
                     class="admin-product-detail-image"
                     onerror="this.src='/assets/images/no-image.png'">
                
                <div class="admin-product-detail-info">
                    <div class="admin-product-detail-info-item">
                        <div class="admin-product-detail-info-label">Giá gốc</div>
                        <div class="admin-product-detail-info-value">${formatPrice(product.price)}</div>
                    </div>
                    <div class="admin-product-detail-info-item">
                        <div class="admin-product-detail-info-label">Giá bán</div>
                        <div class="admin-product-detail-info-value" style="color: ${product.sale_price ? 'var(--admin-primary)' : 'inherit'};">
                            ${formatPrice(finalPrice)}
                            ${product.sale_price ? ` <span style="font-size: 0.875rem; color: var(--admin-text-light);">(${product.discount_percent || 0}% giảm)</span>` : ''}
                        </div>
                    </div>
                    <div class="admin-product-detail-info-item">
                        <div class="admin-product-detail-info-label">Tồn kho</div>
                        <div class="admin-product-detail-info-value">${product.stock || 0} sản phẩm</div>
                    </div>
                    <div class="admin-product-detail-info-item">
                        <div class="admin-product-detail-info-label">Trạng thái</div>
                        <div class="admin-product-detail-info-value">
                            <span class="admin-badge ${product.status === 'active' ? 'confirmed' : 'secondary'}">
                                ${product.status === 'active' ? 'Hoạt động' : product.status === 'inactive' ? 'Tắt' : product.status || 'N/A'}
                            </span>
                        </div>
                    </div>
                    ${product.sku ? `
                    <div class="admin-product-detail-info-item">
                        <div class="admin-product-detail-info-label">SKU</div>
                        <div class="admin-product-detail-info-value">${product.sku}</div>
                    </div>
                    ` : ''}
                    ${product.category_name ? `
                    <div class="admin-product-detail-info-item">
                        <div class="admin-product-detail-info-label">Danh mục</div>
                        <div class="admin-product-detail-info-value">${product.category_name}</div>
                    </div>
                    ` : ''}
                    <div class="admin-product-detail-info-item">
                        <div class="admin-product-detail-info-label">Lượt xem</div>
                        <div class="admin-product-detail-info-value">${product.views || 0}</div>
                    </div>
                    <div class="admin-product-detail-info-item">
                        <div class="admin-product-detail-info-label">Đã bán</div>
                        <div class="admin-product-detail-info-value">${product.sales_count || 0}</div>
                    </div>
                </div>
                
                ${product.description ? `
                <div class="admin-product-detail-description">
                    <strong style="display: block; margin-bottom: 0.5rem;">Mô tả:</strong>
                    <div>${product.description.replace(/\n/g, '<br>')}</div>
                </div>
                ` : ''}
            </div>
        `;
        
    } catch (error) {
        console.error('Failed to load product detail:', error);
        content.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--admin-error);">
                <p>Lỗi khi tải thông tin sản phẩm</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">${error.message}</p>
            </div>
        `;
    }
}

function closeProductDetailModal() {
    const modal = document.getElementById('productDetailModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Make functions global for onclick handlers (export all at once)
window.openCouponModal = openCouponModal;
window.closeCouponModal = closeCouponModal;
window.editCoupon = editCoupon;
window.deleteCoupon = deleteCoupon;
window.updateDiscountInput = updateDiscountInput;
window.loadCoupons = loadCoupons;
window.showCouponDetail = showCouponDetail;
window.closeCouponDetailModal = closeCouponDetailModal;
window.toggleProductCheckbox = toggleProductCheckbox;
window.removeSelectedProduct = removeSelectedProduct;
window.removeSelectedProductInModal = removeSelectedProductInModal;
window.filterProducts = filterProducts;
window.openProductSelectionModal = openProductSelectionModal;
window.closeProductSelectionModal = closeProductSelectionModal;
window.confirmProductSelection = confirmProductSelection;
window.showProductDetail = showProductDetail;
window.closeProductDetailModal = closeProductDetailModal;
// toggleProductSelection already exported above

// Event handlers are now set up in the main DOMContentLoaded listener above

