/**
 * API Client for Sweetie Garden
 * Handles all API calls to backend
 */

// API Base URL - Đảm bảo chạy qua HTTP server, KHÔNG phải file://
const API_BASE_URL = window.location.origin.includes('file://')
    ? 'http://localhost:8000/api'  // Fallback nếu mở từ file://
    : '/api';  // Relative path khi chạy từ HTTP server

// ============================================
// Helper Functions
// ============================================

/**
 * Make API request
 */
async function apiRequest(endpoint, options = {}) {
    const url = API_BASE_URL + endpoint;

    // Warning nếu đang dùng file:// protocol
    if (window.location.protocol === 'file:') {
        console.warn('⚠️ Đang mở từ file://. Vui lòng chạy PHP server!');
        console.warn('Run: php -S localhost:8000');
        console.warn('Then open: http://localhost:8000');
    }

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin', // Include cookies for session
    };

    const config = { ...defaultOptions, ...options };

    // Add body if provided
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);

        // Check if response is OK
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        console.error('Request URL:', url);

        // Friendly error message
        if (error.message.includes('Failed to fetch')) {
            error.message = 'Không thể kết nối API. Hãy chắc chắn bạn đang chạy PHP server (php -S localhost:8000)';
        }

        throw error;
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
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

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ============================================
// Authentication API
// ============================================

const AuthAPI = {
    /**
     * Login
     */
    async login(email, password) {
        const response = await apiRequest('/auth/login.php', {
            method: 'POST',
            body: { email, password }
        });
        return response.data;
    },

    /**
     * Register
     */
    async register(email, password, full_name, phone = null) {
        const response = await apiRequest('/auth/register.php', {
            method: 'POST',
            body: { email, password, full_name, phone }
        });
        return response.data;
    },

    /**
     * Logout
     */
    async logout() {
        const response = await apiRequest('/auth/logout.php', {
            method: 'POST'
        });
        return response.data;
    },

    /**
     * Check authentication status
     */
    async check() {
        try {
            const response = await apiRequest('/auth/check.php', {
                method: 'GET'
            });
            return response.data;
        } catch (error) {
            return { authenticated: false };
        }
    }
};

// ============================================
// Products API
// ============================================

const ProductsAPI = {
    /**
     * Get products list
     */
    async list(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiRequest(`/products/list.php?${queryString}`, {
            method: 'GET'
        });
        return response.data;
    },

    /**
     * Get product detail
     */
    async detail(id = null, slug = null) {
        const params = {};
        if (id) params.id = id;
        if (slug) params.slug = slug;

        const queryString = new URLSearchParams(params).toString();
        const response = await apiRequest(`/products/detail.php?${queryString}`, {
            method: 'GET'
        });
        return response.data;
    }
};

// ============================================
// Cart API
// ============================================

const CartAPI = {
    /**
     * Get cart
     */
    async get() {
        const response = await apiRequest('/cart/get.php', {
            method: 'GET'
        });
        return response.data;
    },

    /**
     * Add to cart
     */
    async add(product_id, quantity = 1) {
        const response = await apiRequest('/cart/add.php', {
            method: 'POST',
            body: { product_id, quantity }
        });
        return response.data;
    },

    /**
     * Update cart item
     */
    async update(cart_id, quantity) {
        const response = await apiRequest('/cart/update.php', {
            method: 'POST',
            body: { cart_id, quantity }
        });
        return response.data;
    },

    /**
     * Remove from cart
     */
    async remove(cart_id) {
        const response = await apiRequest('/cart/remove.php', {
            method: 'POST',
            body: { cart_id }
        });
        return response.data;
    },

    /**
     * Get cart count (for badge)
     */
    /**
     * Get cart count (for badge)
     */
    async getCount() {
        try {
            const cart = await this.get();
            // Prefer total_quantity if available, otherwise fallback to item_count or length
            if (cart.total_quantity !== undefined) {
                return parseInt(cart.total_quantity);
            }
            return cart.item_count || 0;
        } catch (error) {
            return 0;
        }
    },

    /**
     * Update cart badge in UI
     */
    async updateBadge() {
        const count = await this.getCount();
        const badges = document.querySelectorAll('.cart-badge');
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        });
        return count;
    }
};

// ============================================
// Orders API
// ============================================

const OrdersAPI = {
    /**
     * Create order
     */
    async create(orderData) {
        const response = await apiRequest('/orders/create.php', {
            method: 'POST',
            body: orderData
        });
        return response.data;
    },

    /**
     * Get orders list
     */
    async list(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiRequest(`/orders/list.php?${queryString}`, {
            method: 'GET'
        });
        return response.data;
    },

    /**
     * Get order detail
     */
    async detail(id = null, order_number = null) {
        const params = {};
        if (id) params.id = id;
        if (order_number) params.order_number = order_number;

        const queryString = new URLSearchParams(params).toString();
        const response = await apiRequest(`/orders/detail.php?${queryString}`, {
            method: 'GET'
        });
        return response.data;
    }
};

// ============================================
// Wishlist API
// ============================================

const WishlistAPI = {
    /**
     * Get wishlist
     */
    async list() {
        const response = await apiRequest('/wishlist/list.php', {
            method: 'GET'
        });
        return response.data;
    },

    /**
     * Add to wishlist
     */
    async add(product_id) {
        const response = await apiRequest('/wishlist/add.php', {
            method: 'POST',
            body: { product_id }
        });
        return response.data;
    },

    /**
     * Remove from wishlist
     */
    async remove(product_id) {
        const response = await apiRequest('/wishlist/remove.php', {
            method: 'POST',
            body: { product_id }
        });
        return response.data;
    }
};

// ============================================
// User API (Profile & Password)
// ============================================

const UserAPI = {
    profile: {
        /**
         * Get user profile
         */
        async get() {
            const response = await apiRequest('/user/profile.php', {
                method: 'GET'
            });
            return response.data;
        },

        /**
         * Update user profile
         */
        async update(data) {
            const response = await apiRequest('/user/profile.php', {
                method: 'POST',
                body: data
            });
            return response.data;
        }
    },

    password: {
        /**
         * Change password
         */
        async update(current_password, new_password) {
            const response = await apiRequest('/user/change-password.php', {
                method: 'POST',
                body: { current_password, new_password }
            });
            return response.data;
        }
    },

    addresses: {
        async list() {
            const response = await apiRequest('/user/addresses.php', { method: 'GET' });
            return response.data;
        },
        async create(data) {
            const response = await apiRequest('/user/addresses.php', { method: 'POST', body: { ...data, action: 'create' } });
            return response.data;
        },
        async delete(id) {
            const response = await apiRequest('/user/addresses.php', { method: 'POST', body: { id, action: 'delete' } });
            return response.data;
        },
        async setDefault(id) {
            const response = await apiRequest('/user/addresses.php', { method: 'POST', body: { id, action: 'set_default' } });
            return response.data;
        }
    }
};

// ============================================
// Global API object
// ============================================

window.API = {
    auth: AuthAPI,
    products: ProductsAPI,
    cart: CartAPI,
    orders: OrdersAPI,
    user: UserAPI,
    wishlist: WishlistAPI,
    showNotification
};

// ============================================
// Auto-update cart badge on page load
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await CartAPI.updateBadge();
    } catch (error) {
        console.error('Failed to update cart badge:', error);
    }
});

