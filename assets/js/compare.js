/**
 * Compare Page Logic
 * Handles storage and rendering of compared products.
 */

const COMPARE_STORAGE_KEY = 'sweetie_garden_compare';
const MAX_COMPARE_ITEMS = 3;

class CompareManager {
    constructor() {
        this.items = JSON.parse(localStorage.getItem(COMPARE_STORAGE_KEY)) || [];
    }

    add(product) {
        if (this.items.find(item => item.id == product.id)) {
            alert('Sản phẩm này đã có trong danh sách so sánh!');
            return;
        }

        if (this.items.length >= MAX_COMPARE_ITEMS) {
            alert(`Bạn chỉ có thể so sánh tối đa ${MAX_COMPARE_ITEMS} sản phẩm. Hãy xóa bớt để thêm mới.`);
            return;
        }

        this.items.push(product);
        this.save();
        alert('Đã thêm vào danh sách so sánh!');
        this.updateBadge(); // Helper if we had a badge

        // If we are on the compare page, reload
        if (window.location.pathname.includes('compare.html')) {
            window.location.reload();
        }
    }

    remove(id) {
        this.items = this.items.filter(item => item.id != id);
        this.save();
        if (window.location.pathname.includes('compare.html')) {
            this.renderTable();
        }
    }

    save() {
        localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(this.items));
    }

    updateBadge() {
        // Optional: Update a counter in header if we add one
        const count = this.items.length;
        // console.log('Compare count:', count);
    }

    renderTable() {
        const container = document.querySelector('.compare-table');
        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <p style="color: var(--text-gray); margin-bottom: 1rem;">Chưa có sản phẩm nào để so sánh.</p>
                    <a href="products.html" class="add-to-cart-btn" style="text-decoration: none; display: inline-block;">
                        Thêm sản phẩm
                    </a>
                </div>
            `;
            return;
        }

        let html = '<table><thead><tr><th>Tiêu chí</th>';

        // Header Row (Images & Names)
        this.items.forEach(item => {
            html += `
                <th>
                    <div style="text-align: center;">
                        <div class="product-image" style="width: 150px; height: 150px; margin: 0 auto 1rem; overflow: hidden; border-radius: 8px;">
                            <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div style="font-weight: 600; margin-bottom: 0.5rem; height: 40px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                            <a href="product-detail.html?id=${item.id}" style="color: inherit; text-decoration: none;">${item.name}</a>
                        </div>
                        <div class="product-price" style="font-size: 1.25rem; color: var(--accent-dark); font-weight: 800;">
                            ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                        </div>
                        <button class="remove-btn" onclick="compareManager.remove(${item.id})" 
                            style="margin-top: 1rem; background: none; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; cursor: pointer; color: #666; font-size: 0.8rem;">
                            🗑️ Xóa
                        </button>
                    </div>
                </th>
            `;
        });
        html += '</tr></thead><tbody>';

        // Attributes Config
        // Note: Real attributes would come from DB. Assuming 'attributes' object or mock data logic.
        // For simplicity, we'll map common fields.
        const attributes = [
            { label: 'Danh mục', key: 'category_id', format: (val) => getCategoryName(val) },
            { label: 'Đánh giá', key: 'rating', format: (val) => renderStars(val || 5) },
            // Mock static attributes for demo as our simple API might not return everything
            { label: 'Tình trạng', key: 'status', format: () => 'Còn hàng' },
            { label: 'Giao hàng', key: 'shipping', format: () => 'Trong 2h' }
        ];

        attributes.forEach(attr => {
            html += `<tr><td><strong>${attr.label}</strong></td>`;
            this.items.forEach(item => {
                let val = item[attr.key];
                if (attr.format) val = attr.format(val);
                html += `<td>${val}</td>`;
            });
            html += `</tr>`;
        });

        // Action Row
        html += `<tr><td><strong>Hành động</strong></td>`;
        this.items.forEach(item => {
            html += `
                <td>
                    <button class="add-to-cart-btn" onclick="addToCart(${item.id})" style="width: 100%;">Thêm vào giỏ</button>
                    <a href="product-detail.html?id=${item.id}" style="display: block; text-align: center; margin-top: 0.5rem; color: var(--accent-color); text-decoration: none; font-size: 0.9rem;">
                        Xem chi tiết
                    </a>
                </td>
            `;
        });
        html += `</tr></tbody></table>`;

        container.innerHTML = html;
    }
}

// Helpers
function getCategoryName(slug) {
    const map = {
        'banh-kem': 'Bánh kem',
        'hoa-tuoi': 'Hoa tươi',
        'combo': 'Combo',
        'qua-tang': 'Quà tặng'
    };
    return map[slug] || slug || 'Sản phẩm';
}

function renderStars(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
        stars += i < rating ? '⭐' : '<span style="opacity: 0.3">⭐</span>';
    }
    return `<div style="white-space: nowrap;">${stars}</div>`;
}

// Initialize
const compareManager = new CompareManager();

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.compare-table')) {
        compareManager.renderTable();
    }
});

// Global exposure for onClick events
window.compareManager = compareManager;
window.addToCart = (id) => {
    // Re-use logic from main.js or product-detail.js if available
    // For now, simpler:
    if (window.API && window.API.cart) {
        window.API.cart.add(id, 1);
    } else {
        alert('Đã thêm sản phẩm vào giỏ hàng!');
    }
};
