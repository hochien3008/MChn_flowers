/**
 * Wishlist Page Logic
 */

document.addEventListener('DOMContentLoaded', async function () {
    // Check Auth
    const user = await window.API.auth.check();
    if (!user) {
        window.location.href = '../auth/login.html?redirect=../pages/wishlist.html';
        return;
    }

    loadWishlist();
});

async function loadWishlist() {
    const grid = document.getElementById('wishlistGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="col-span-full text-center py-5"><div class="spinner"></div> Đang tải...</div>';

    try {
        const result = await window.API.wishlist.list();
        const products = result.products || [];

        if (products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">💔</div>
                    <h3>Danh sách yêu thích trống</h3>
                    <p style="color: #666; margin-bottom: 1.5rem;">Hãy thêm những sản phẩm bạn yêu thích vào đây nhé!</p>
                    <a href="../shop/products.html" class="btn-primary">Khám phá ngay</a>
                </div>
            `;
            return;
        }

        grid.innerHTML = products.map(product => {
            const detailUrl = `../shop/product-detail.html?slug=${product.slug}`;
            const price = product.sale_price || product.price;
            const hasDiscount = !!product.sale_price;

            return `
                <div class="product-card" id="wishlist-item-${product.id}">
                    <div class="wishlist-icon active" onclick="removeFromWishlist(${product.id})" title="Xóa khỏi danh sách">❤️</div>
                    <a href="${detailUrl}">
                        <div class="product-image" style="background-image: url('${product.image_url || '../assets/images/logo.png'}'); background-size: cover; background-position: center;"></div>
                    </a>
                    <div class="product-info">
                        <div class="product-category">${product.category_name || 'Sản phẩm'}</div>
                        <a href="${detailUrl}" class="product-name">${product.name}</a>
                        <div class="product-footer">
                            <div class="product-price">
                                ${formatPrice(price)}
                                ${hasDiscount ? `<span class="old-price">${formatPrice(product.price)}</span>` : ''}
                            </div>
                            <button class="add-to-cart-btn" onclick="addToCart(${product.id})">Thêm vào giỏ</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Load wishlist failed:', error);
        grid.innerHTML = '<div class="error-msg">Không thể tải danh sách yêu thích.</div>';
    }
}

async function removeFromWishlist(id) {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này khỏi danh sách yêu thích?')) return;

    try {
        await window.API.wishlist.remove(id);
        
        // Remove from DOM
        const el = document.getElementById(`wishlist-item-${id}`);
        if (el) {
            el.remove();
            
            // Check if empty
            const grid = document.getElementById('wishlistGrid');
            if (grid && grid.children.length === 0) {
                loadWishlist(); // Reload to show empty state
            }
        }
        window.API.showNotification('Đã xóa sản phẩm', 'success');
    } catch (error) {
        window.API.showNotification('Lỗi khi xóa sản phẩm', 'error');
    }
}

async function addToCart(id) {
    try {
        await window.API.cart.add(id, 1);
        window.API.showNotification('Đã thêm vào giỏ hàng!', 'success');
        await window.API.cart.updateBadge();
    } catch (error) {
        window.API.showNotification(error.message, 'error');
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// Global expose
window.removeFromWishlist = removeFromWishlist;
window.addToCart = addToCart;
