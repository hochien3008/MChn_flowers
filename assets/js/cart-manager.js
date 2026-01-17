/**
 * Cart Manager Class
 * BRIDGE VERSION: Delegates all logic to Server API via window.API.cart
 * This ensures Single Source of Truth.
 */
class CartManager {
    constructor() {
        this.items = [];
        // No longer use localStorage
        this.load();
    }

    /**
     * Load cart from Server
     */
    async load() {
        if (!window.API) return;

        try {
            const data = await window.API.cart.get();
            if (data && data.items) {
                // Map server items to expected format for frontend
                this.items = data.items.map(item => ({
                    id: item.id, // This is now CART ID, not Product ID
                    product_id: item.product_id,
                    name: item.product_name,
                    slug: item.product_slug,
                    price: item.price,
                    sale_price: item.sale_price,
                    quantity: item.quantity,
                    image: item.image_url,
                    stock: item.stock
                }));
            } else {
                this.items = [];
            }
            
            // Dispatch event for UI updates
            this.updateBadge(); // This now calls API.cart.updateBadge
            window.dispatchEvent(new CustomEvent('cart-updated', { detail: this.items }));
            
        } catch (error) {
            console.error('Failed to sync cart:', error);
        }
    }

    /**
     * Save cart - No-op since we use Server
     */
    save() {
        // Did nothing, server handles persistence
    }

    /**
     * Add item to cart
     * Delegates to API.cart.add
     */
    async add(product, quantity = 1) {
        if (!window.API) return;
        
        // Handle input variations
        const productId = product.id || product.product_id;
        
        try {
            await window.API.cart.add(productId, quantity);
            
            if (typeof showNotification === 'function') {
                showNotification(`Đã thêm vào giỏ: ${product.name || 'Sản phẩm'}`, 'success');
            }
            
            // Reload to get updated state
            await this.load();
            
        } catch (error) {
            console.error('Add to cart failed:', error);
            if (typeof showNotification === 'function') {
                showNotification(error.message || 'Không thể thêm vào giỏ', 'error');
            }
        }
    }

    /**
     * Remove item from cart
     * Delegates to API.cart.remove
     */
    async remove(cartId) {
        if (!window.API) return;

        try {
            await window.API.cart.remove(cartId);
            
            if (typeof showNotification === 'function') {
                showNotification('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
            }
            
            // Reload
            await this.load();
            
        } catch (error) {
            console.error('Remove failed:', error);
            if (typeof showNotification === 'function') {
                showNotification(error.message || 'Không thể xóa sản phẩm', 'error');
            }
        }
    }

    /**
     * Update item quantity
     * Delegates to API.cart.update
     */
    async updateQuantity(cartId, quantity) {
        if (!window.API) return;
        
        quantity = parseInt(quantity);
        if (quantity < 1) {
            return this.remove(cartId);
        }

        try {
            await window.API.cart.update(cartId, quantity);
            // Reload
            await this.load();
            
        } catch (error) {
            console.error('Update failed:', error);
            if (typeof showNotification === 'function') {
                showNotification(error.message || 'Không thể cập nhật số lượng', 'error');
            }
        }
    }

    /**
     * Get total item count
     */
    getCount() {
        return this.items.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0);
    }

    /**
     * Get total price
     */
    getTotal() {
        return this.items.reduce((total, item) => {
             const price = item.sale_price || item.price || 0;
             return total + (price * item.quantity);
        }, 0);
    }

    /**
     * Update cart badge in header
     */
    updateBadge() {
        if (window.API && window.API.cart) {
            window.API.cart.updateBadge(); // Use the logic in api.js which knows about total_quantity
        }
    }

    /**
     * Clear cart
     */
    clear() {
        // Not implemented on API yet, or maybe loop remove?
        // For now, doing nothing or we could add an API endpoint for clear
        this.items = [];
    }
}

// Initialize global Cart Manager
window.cartManager = new CartManager();
