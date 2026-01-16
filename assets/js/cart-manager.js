/**
 * Cart Manager Class
 * Handles shopping cart logic, persistence, and UI updates
 */
class CartManager {
    constructor() {
        this.items = [];
        this.STORAGE_KEY = 'sweetie_garden_cart';
        this.MAX_QUANTITY = 99;
        this.load();
    }

    /**
     * Load cart from localStorage
     */
    load() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                this.items = JSON.parse(stored);
            } catch (e) {
                console.error('Failed to load cart:', e);
                this.items = [];
            }
        }
        this.updateBadge();
    }

    /**
     * Save cart to localStorage
     */
    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
        this.updateBadge();
        // Dispatch event for other components to listen
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: this.items }));
    }

    /**
     * Add item to cart
     * @param {Object} product - Product object
     * @param {number} quantity - Quantity to add (default 1)
     */
    add(product, quantity = 1) {
        if (!product || !product.id) return;

        // Ensure quantity is valid
        quantity = parseInt(quantity) || 1;
        if (quantity < 1) quantity = 1;

        // Check if item exists
        const existingItem = this.items.find(item => item.id == product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
            if (existingItem.quantity > this.MAX_QUANTITY) {
                existingItem.quantity = this.MAX_QUANTITY;
                if (typeof showNotification === 'function') {
                    showNotification(`Số lượng tối đa là ${this.MAX_QUANTITY}`, 'warning');
                }
            } else {
                if (typeof showNotification === 'function') {
                    showNotification(`Đã cập nhật số lượng: ${product.name}`, 'success');
                }
            }
        } else {
            // Add new item
            // Normalize product data
            const item = {
                id: product.id,
                name: product.name,
                price: product.sale_price || product.price,
                original_price: product.price,
                image: product.image_url || product.image, // Handle variants
                slug: product.slug,
                quantity: quantity
            };
            this.items.push(item);

            if (typeof showNotification === 'function') {
                showNotification(`Đã thêm vào giỏ: ${product.name}`, 'success');
            }
        }

        this.save();
    }

    /**
     * Remove item from cart
     */
    remove(id) {
        this.items = this.items.filter(item => item.id != id);
        this.save();
        if (typeof showNotification === 'function') {
            showNotification('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
        }
    }

    /**
     * Update item quantity
     */
    updateQuantity(id, quantity) {
        const item = this.items.find(item => item.id == id);
        if (item) {
            quantity = parseInt(quantity);
            if (quantity > 0 && quantity <= this.MAX_QUANTITY) {
                item.quantity = quantity;
                this.save();
            } else if (quantity <= 0) {
                this.remove(id);
            }
        }
    }

    /**
     * Get total item count
     */
    getCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    /**
     * Get total price
     */
    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    /**
     * Update cart badge in header
     */
    updateBadge() {
        const badges = document.querySelectorAll('.cart-badge');
        const count = this.getCount();
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    /**
     * Clear cart
     */
    clear() {
        this.items = [];
        this.save();
    }
}

// Initialize global Cart Manager
window.cartManager = new CartManager();
