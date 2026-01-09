/**
 * Checkout Page Logic
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Load cart summary
    await loadCartSummary();

    // Setup checkout form
    setupCheckoutForm();
});

/**
 * Load cart summary
 */
async function loadCartSummary() {
    if (!window.API) return;

    try {
        const cartData = await window.API.cart.get();
        
        if (cartData.items.length === 0) {
            // Redirect to cart if empty
            window.location.href = 'cart.html';
            return;
        }
        
        // Render order summary
        renderOrderSummary(cartData);
        
    } catch (error) {
        console.error('Failed to load cart:', error);
    }
}

/**
 * Render order summary
 */
function renderOrderSummary(cartData) {
    const container = document.querySelector('.order-summary-items, .checkout-items');
    
    if (!container) return;

    // Render items
    container.innerHTML = cartData.items.map(item => `
        <div class="order-item">
            <div class="order-item-info">
                <span class="order-item-name">${item.product_name}</span>
                <span class="order-item-quantity">x${item.quantity}</span>
            </div>
            <div class="order-item-price">${formatPrice(item.subtotal)}</div>
        </div>
    `).join('');

    // Update totals
    const subtotal = cartData.total;
    const shippingFee = 30000; // Default
    const total = subtotal + shippingFee;

    const subtotalElement = document.querySelector('.checkout-subtotal, [data-checkout-subtotal]');
    const shippingElement = document.querySelector('.checkout-shipping, [data-checkout-shipping]');
    const totalElement = document.querySelector('.checkout-total, [data-checkout-total]');

    if (subtotalElement) subtotalElement.textContent = formatPrice(subtotal);
    if (shippingElement) shippingElement.textContent = formatPrice(shippingFee);
    if (totalElement) totalElement.textContent = formatPrice(total);
}

/**
 * Setup checkout form
 */
function setupCheckoutForm() {
    const form = document.querySelector('.checkout-form, form[data-checkout-form]');
    
    if (!form) {
        console.warn('Checkout form not found');
        return;
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!window.API) {
            alert('API chưa được tải. Vui lòng thử lại.');
            return;
        }

        // Get form data
        const formData = new FormData(form);
        const orderData = {
            shipping_name: formData.get('name') || formData.get('shipping_name'),
            shipping_phone: formData.get('phone') || formData.get('shipping_phone'),
            shipping_address: formData.get('address') || formData.get('shipping_address'),
            shipping_city: formData.get('city') || formData.get('shipping_city'),
            shipping_district: formData.get('district') || formData.get('shipping_district'),
            shipping_ward: formData.get('ward') || formData.get('shipping_ward'),
            payment_method: formData.get('payment_method') || 'cod',
            coupon_code: formData.get('coupon_code') || formData.get('coupon'),
            notes: formData.get('notes') || formData.get('note')
        };

        // Validate
        if (!orderData.shipping_name || !orderData.shipping_phone || !orderData.shipping_address) {
            window.API.showNotification('Vui lòng điền đầy đủ thông tin giao hàng', 'error');
            return;
        }

        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang xử lý...';

            const result = await window.API.orders.create(orderData);
            
            window.API.showNotification('Đặt hàng thành công!', 'success');
            
            // Redirect to order confirmation
            setTimeout(() => {
                window.location.href = `../account/order-tracking.html?order=${result.order_number}`;
            }, 1500);

        } catch (error) {
            window.API.showNotification(error.message || 'Đặt hàng thất bại. Vui lòng thử lại.', 'error');
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Đặt hàng';
        }
    });

    // Coupon code application
    const couponBtn = document.querySelector('.apply-coupon-btn, [data-apply-coupon]');
    if (couponBtn) {
        couponBtn.addEventListener('click', function() {
            const couponInput = document.querySelector('input[name="coupon_code"], input[name="coupon"]');
            const couponCode = couponInput?.value.trim();
            
            if (couponCode) {
                window.API.showNotification('Mã giảm giá sẽ được áp dụng khi đặt hàng', 'info');
            } else {
                window.API.showNotification('Vui lòng nhập mã giảm giá', 'error');
            }
        });
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

