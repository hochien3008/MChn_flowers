/**
 * Cart Page Logic
 * Renders the cart and handles user interactions using CartManager
 */

document.addEventListener('DOMContentLoaded', function () {
    renderCart();

    // Listen for cart updates
    window.addEventListener('cart-updated', function () {
        renderCart();
    });
});

function renderCart() {
    const container = document.querySelector('.cart-items');
    const summaryContainer = document.querySelector('.cart-summary');
    const emptyMessage = document.querySelector('.cart-empty-message');
    const cartSection = document.querySelector('.cart-section');

    if (!window.cartManager) {
        console.error('CartManager not loaded');
        return;
    }

    const items = window.cartManager.items;

    if (items.length === 0) {
        if (container) container.innerHTML = '<div style="text-align: center; padding: 2rem;">Giỏ hàng trống</div>';
        updateSummary(); // Ensure summary is reset
        return;
    }

    // Render Items
    if (container) {
        container.innerHTML = items.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image" style="background-image: url('${item.image || '../assets/images/default-product.png'}'); background-size: cover; background-position: center; width: 80px; height: 80px; border-radius: 8px; background-color: #fce4ec;"></div>
                <div class="cart-item-info">
                    <div class="cart-item-name"><a href="product-detail.html?slug=${item.slug || ''}">${item.name || 'Sản phẩm'}</a></div>
                    <div class="cart-item-options">
                        Đơn giá: ${formatPrice(item.price)}
                    </div>
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="updateCartItemQty('${item.id}', ${item.quantity - 1})">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" onchange="updateCartItemQty('${item.id}', this.value)">
                        <button class="quantity-btn" onclick="updateCartItemQty('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <div class="cart-item-price">
                    <div class="cart-item-price-value">${formatPrice(item.price * item.quantity)}</div>
                    <button class="remove-btn" onclick="window.cartManager.remove('${item.id}')">🗑️ Xóa</button>
                </div>
            </div>
        `).join('');
    }

    // Render Summary
    updateSummary();
}

function updateCartItemQty(id, qty) {
    window.cartManager.updateQuantity(id, qty);
}

function updateSummary() {
    const subtotal = window.cartManager.getTotal();
    const shipping = subtotal > 0 ? 30000 : 0; // Shipping only if items exist
    const discount = 0; // Placeholder
    const total = subtotal + shipping - discount;

    const summaryEl = document.querySelector('.cart-summary');
    if (!summaryEl) return;

    // Update specific elements if they exist, or re-render the whole block
    // Assuming structure matches cart.html
    const values = summaryEl.querySelectorAll('.summary-row span:last-child');
    if (values.length >= 4) {
        values[0].textContent = formatPrice(subtotal);
        values[1].textContent = formatPrice(shipping);
        values[2].textContent = formatPrice(discount); // Discount
        values[3].textContent = formatPrice(total);
    }
}
