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
            shipping_name: formData.get('shipping_name')?.trim(),
            shipping_phone: formData.get('shipping_phone')?.trim(),
            shipping_email: formData.get('shipping_email')?.trim(),
            shipping_address: formData.get('shipping_address')?.trim(),
            shipping_city: formData.get('shipping_city'),
            shipping_district: formData.get('shipping_district'),
            shipping_ward: formData.get('shipping_ward'),
            payment_method: formData.get('payment_method') || 'cod',
            delivery_time: formData.get('delivery_time'),
            notes: formData.get('notes')?.trim()
        };

        // Enhanced Validation
        if (!orderData.shipping_name || orderData.shipping_name.length < 2) {
            window.API.showNotification('Vui lòng nhập họ và tên hợp lệ', 'error');
            return;
        }

        const phoneRegex = /^(0|84)(3|5|7|8|9)([0-9]{8})$/;
        const isNumeric = /^\d+$/.test(orderData.shipping_phone);

        if (!orderData.shipping_phone || !isNumeric) {
            window.API.showNotification('Số điện thoại phải là chữ số', 'error');
            return;
        }

        if (!phoneRegex.test(orderData.shipping_phone)) {
            window.API.showNotification('Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số (ví dụ: 0912345678)', 'error');
            return;
        }

        if (!orderData.shipping_address || orderData.shipping_address.length < 5) {
            window.API.showNotification('Vui lòng nhập địa chỉ chi tiết', 'error');
            return;
        }

        if (!orderData.shipping_city || !orderData.shipping_district || !orderData.shipping_ward) {
            window.API.showNotification('Vui lòng chọn đầy đủ khu vực giao hàng', 'error');
            return;
        }

        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner" style="width: 15px; height: 15px; display: inline-block;"></span> Đang xử lý...';

            const result = await window.API.orders.create(orderData);
            
            window.API.showNotification('Đặt hàng thành công!', 'success');
            
            // Redirect to order tracking in account page
            setTimeout(() => {
                window.location.href = `../pages/account.html#tab-orders`;
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

