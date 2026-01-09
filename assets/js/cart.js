/**
 * Cart Page Logic
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Load cart
    await loadCart();

    // Setup event listeners
    setupCartEventListeners();
});

/**
 * Load cart from API
 */
async function loadCart() {
    if (!window.API) {
        console.error('API not loaded');
        return;
    }

    try {
        const cartData = await window.API.cart.get();
        
        // Render cart items
        renderCartItems(cartData.items);
        
        // Update totals
        updateCartTotals(cartData);
        
        // Update badge
        await window.API.cart.updateBadge();
        
    } catch (error) {
        console.error('Failed to load cart:', error);
        showCartError('Không thể tải giỏ hàng. Vui lòng thử lại sau.');
    }
}

/**
 * Render cart items
 */
function renderCartItems(items) {
    const container = document.querySelector('.cart-items');
    
    if (!container) {
        console.warn('Cart items container not found');
        return;
    }

    if (!items || items.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <p style="font-size: 1.2rem; color: #666; margin-bottom: 1rem;">
                    Giỏ hàng của bạn đang trống
                </p>
                <a href="../shop/products.html" class="btn-primary">
                    Tiếp tục mua sắm
                </a>
            </div>
        `;
        
        // Hide summary if exists
        const summary = document.querySelector('.cart-summary');
        if (summary) {
            summary.style.display = 'none';
        }
        
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="cart-item" data-cart-id="${item.id}">
            <div class="cart-item-image">
                ${item.image_url 
                    ? `<img src="${item.image_url}" alt="${item.product_name}">`
                    : '🎂'
                }
            </div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.product_name}</div>
                <div class="cart-item-price">
                    ${item.sale_price 
                        ? `<span class="sale-price">${formatPrice(item.final_price)}</span>
                           <span class="old-price">${formatPrice(item.price)}</span>`
                        : `<span>${formatPrice(item.final_price)}</span>`
                    }
                </div>
                <div class="quantity-control">
                    <button class="quantity-btn decrease" data-cart-id="${item.id}">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${item.stock}" data-cart-id="${item.id}">
                    <button class="quantity-btn increase" data-cart-id="${item.id}">+</button>
                </div>
                <div class="cart-item-subtotal">
                    Tổng: ${formatPrice(item.subtotal)}
                </div>
            </div>
            <button class="remove-item" data-cart-id="${item.id}" title="Xóa">
                ×
            </button>
        </div>
    `).join('');
}

/**
 * Update cart totals
 */
function updateCartTotals(cartData) {
    const subtotalElement = document.querySelector('.subtotal-amount, [data-subtotal]');
    const totalElement = document.querySelector('.total-amount, [data-total]');
    const itemCountElement = document.querySelector('.item-count, [data-item-count]');
    
    if (subtotalElement) {
        subtotalElement.textContent = formatPrice(cartData.total);
    }
    
    if (totalElement) {
        // Add shipping fee if needed
        const shippingFee = 30000; // Default shipping fee
        const total = cartData.total + shippingFee;
        totalElement.textContent = formatPrice(total);
    }
    
    if (itemCountElement) {
        itemCountElement.textContent = cartData.item_count;
    }
}

/**
 * Setup event listeners
 */
function setupCartEventListeners() {
    const container = document.querySelector('.cart-items');
    
    if (!container) return;

    // Quantity buttons
    container.addEventListener('click', async function(e) {
        const decreaseBtn = e.target.closest('.quantity-btn.decrease');
        const increaseBtn = e.target.closest('.quantity-btn.increase');
        const removeBtn = e.target.closest('.remove-item');
        
        if (decreaseBtn) {
            await updateQuantity(decreaseBtn.dataset.cartId, -1);
        } else if (increaseBtn) {
            await updateQuantity(increaseBtn.dataset.cartId, 1);
        } else if (removeBtn) {
            await removeFromCart(removeBtn.dataset.cartId);
        }
    });

    // Quantity input change
    container.addEventListener('change', async function(e) {
        const quantityInput = e.target.closest('.quantity-input');
        if (quantityInput) {
            const cartId = quantityInput.dataset.cartId;
            const newQuantity = parseInt(quantityInput.value);
            
            if (newQuantity > 0) {
                await setQuantity(cartId, newQuantity);
            }
        }
    });
}

/**
 * Update quantity (increase/decrease)
 */
async function updateQuantity(cartId, change) {
    const input = document.querySelector(`.quantity-input[data-cart-id="${cartId}"]`);
    if (!input) return;
    
    const currentQuantity = parseInt(input.value);
    const newQuantity = Math.max(1, currentQuantity + change);
    
    await setQuantity(cartId, newQuantity);
}

/**
 * Set specific quantity
 */
async function setQuantity(cartId, quantity) {
    if (!window.API) return;
    
    try {
        await window.API.cart.update(parseInt(cartId), quantity);
        
        // Reload cart
        await loadCart();
        
    } catch (error) {
        window.API.showNotification(error.message || 'Cập nhật giỏ hàng thất bại', 'error');
    }
}

/**
 * Remove item from cart
 */
async function removeFromCart(cartId) {
    if (!window.API) return;
    
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
        return;
    }
    
    try {
        await window.API.cart.remove(parseInt(cartId));
        
        window.API.showNotification('Đã xóa khỏi giỏ hàng', 'success');
        
        // Reload cart
        await loadCart();
        
    } catch (error) {
        window.API.showNotification(error.message || 'Xóa khỏi giỏ hàng thất bại', 'error');
    }
}

/**
 * Show error message
 */
function showCartError(message) {
    const container = document.querySelector('.cart-items');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <p style="color: #ef4444; font-size: 1.1rem;">${message}</p>
            </div>
        `;
    }
}

/**
 * Format price helper
 */
function formatPrice(price) {
    if (!price) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

