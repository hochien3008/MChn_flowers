/**
 * Admin Products Management
 */

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin products page loaded');
    
    // Wait for API to be loaded
    if (!window.API) {
        console.log('Waiting for API to load...');
        let retries = 0;
        const checkAPI = setInterval(() => {
            retries++;
            if (window.API || retries > 20) {
                clearInterval(checkAPI);
                if (window.API) {
                    console.log('API loaded, initializing...');
                    initializeAdminProducts();
                } else {
                    console.error('API failed to load after 10 seconds');
                }
            }
        }, 500);
    } else {
        initializeAdminProducts();
    }
});

function initializeAdminProducts() {
    // Load categories first
    loadCategories().then(() => {
        // Load products list - Không có filter, hiển thị TẤT CẢ
        loadAdminProducts({});
    });

    // Setup add product form
    setupAddProductForm();

    // Setup filters
    setupFilters();

    // Setup edit/delete handlers (will be re-setup after rendering)
    setupProductActions();
}

/**
 * Load products for admin
 */
/**
 * Perform search (with loading indicator)
 */
async function performSearch(params = {}) {
    const searchLoading = document.getElementById('searchLoading');
    
    try {
        await loadAdminProducts(params);
    } finally {
        // Hide loading indicator
        if (searchLoading) {
            searchLoading.style.display = 'none';
        }
    }
}

async function loadAdminProducts(params = {}) {
    if (!window.API) {
        console.warn('API not loaded yet, retrying...');
        // Retry after a short delay
        setTimeout(() => loadAdminProducts(params), 500);
        return;
    }

    try {
        // Add admin flag to params
        params.admin = 'true';
        console.log('Loading products with params:', params);
        
        const result = await window.API.products.list(params);
        console.log('📥 API response:', result);
        
        // Handle response format
        // API response structure: { success: true, data: { products: [...], pagination: {...} } }
        // But API.products.list() returns result.data, so:
        let products = [];
        let pagination = null;
        
        if (Array.isArray(result)) {
            // Nếu result là array trực tiếp
            products = result;
        } else if (result.products) {
            // Nếu result có products property
            products = result.products;
            pagination = result.pagination;
        } else if (result.data && result.data.products) {
            // Nếu result có data.products (format từ API)
            products = result.data.products;
            pagination = result.data.pagination;
        } else {
            console.error('❌ Unexpected API response format:', result);
            products = [];
        }
        
        console.log('✅ Products array:', products);
        console.log('✅ Products count:', products.length);
        if (products.length > 0) {
            console.log('✅ First product sample:', products[0]);
            console.log('✅ First product keys:', Object.keys(products[0]));
            console.log('✅ First product sales_count:', products[0].sales_count, typeof products[0].sales_count);
            console.log('✅ First product status:', products[0].status);
        } else {
            console.warn('⚠️ No products found in response');
        }
        
        // Update search results count
        updateSearchResultsCount(products.length, params.search);
        
        if (products && products.length > 0) {
            renderAdminProducts(products);
            
            // Update pagination if available
            if (pagination) {
                renderPagination(pagination);
            }
        } else {
            // No products found
            console.warn('⚠️ No products to render, showing empty state');
            renderAdminProducts([]);
        }
        
    } catch (error) {
        console.error('Failed to load products:', error);
        showNotification('Không thể tải danh sách sản phẩm: ' + error.message, 'error');
        // Show empty state
        renderAdminProducts([]);
        updateSearchResultsCount(0, params.search);
    }
}

/**
 * Update search results count display
 */
function updateSearchResultsCount(count, searchTerm) {
    const resultsCount = document.getElementById('searchResultsCount');
    const resultsText = document.getElementById('searchResultsText');
    
    if (!resultsCount || !resultsText) return;
    
    if (searchTerm && searchTerm.trim()) {
        if (count > 0) {
            resultsText.textContent = `Tìm thấy ${count} sản phẩm cho "${searchTerm}"`;
            resultsCount.style.display = 'block';
            resultsCount.style.background = '#f0fdf4';
            resultsCount.style.color = '#16a34a';
        } else {
            resultsText.textContent = `Không tìm thấy sản phẩm nào cho "${searchTerm}"`;
            resultsCount.style.display = 'block';
            resultsCount.style.background = '#fef2f2';
            resultsCount.style.color = '#dc2626';
        }
    } else {
        resultsCount.style.display = 'none';
    }
}

// Make functions global
window.getCurrentFilters = getCurrentFilters;
window.loadAdminProducts = loadAdminProducts;

/**
 * Render pagination
 */
function renderPagination(pagination) {
    const paginationContainer = document.querySelector('.admin-pagination');
    if (!paginationContainer || !pagination) return;
    
    const { current_page, total_pages, has_prev, has_next } = pagination;
    
    let paginationHtml = '';
    
    if (has_prev) {
        paginationHtml += `<button class="admin-page-btn" onclick="loadAdminProducts({ page: ${current_page - 1} })">‹ Trước</button>`;
    }
    
    const startPage = Math.max(1, current_page - 2);
    const endPage = Math.min(total_pages, current_page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `<button class="admin-page-btn ${i === current_page ? 'active' : ''}" onclick="loadAdminProducts({ page: ${i} })">${i}</button>`;
    }
    
    if (has_next) {
        paginationHtml += `<button class="admin-page-btn" onclick="loadAdminProducts({ page: ${current_page + 1} })">Sau ›</button>`;
    }
    
    paginationContainer.innerHTML = paginationHtml;
}

// Make loadAdminProducts global
window.loadAdminProducts = loadAdminProducts;

/**
 * Render products table for admin
 */
function renderAdminProducts(products) {
    const tbody = document.querySelector('.admin-table tbody');
    
    if (!tbody) {
        console.error('Table body not found!');
        return;
    }

    console.log('Rendering products:', products);

    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem;">
                    Chưa có sản phẩm nào
                </td>
            </tr>
        `;
        return;
    }

    // Clear tbody first
    tbody.innerHTML = '';
    
    // Helper function để tạo cell - ĐỊNH NGHĨA TRƯỚC
    function createCell(style, content) {
        const td = document.createElement('td');
        if (style) td.style.cssText = style;
        td.innerHTML = content;
        return td;
    }
    
    // Render each product - VERSION ĐƠN GIẢN, CHỈ HIỂN THỊ ĐÚNG THÔNG TIN
    products.forEach((product) => {
        // Get product ID
        const productId = product.id || product.product_id || 0;
        
        // Helper functions
        const hasValue = (val) => val !== undefined && val !== null && val !== '';
        const safeString = (val, defaultVal = '-') => (hasValue(val) ? String(val) : defaultVal);
        const safeNumber = (val, defaultVal = 0) => {
            if (!hasValue(val)) return defaultVal;
            const num = Number(val);
            return isNaN(num) ? defaultVal : num;
        };
        
        // Chuẩn bị dữ liệu cho từng cột
        // 1. HÌNH ẢNH
        const imageUrl = product.image_url || product.image || null;
        const imageHtml = (imageUrl && imageUrl.trim() !== '')
            ? `<img src="${imageUrl}" alt="${product.name || 'Product'}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; display: block;">`
            : `<div style="background: linear-gradient(135deg, #ffe0b2, #ffccbc); width: 50px; height: 50px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🎂</div>`;
        
        // 2. TÊN SẢN PHẨM
        const name = safeString(product.name, 'Chưa có tên');
        
        // 3. LOẠI
        const category = safeString(product.category_name || product.category, 'Chưa phân loại');
        
        // 4. GIÁ
        const price = (hasValue(product.price) && Number(product.price) > 0) 
            ? formatPrice(Number(product.price)) 
            : '-';
        
        // 5. GIÁ KM
        const salePrice = (hasValue(product.sale_price) && Number(product.sale_price) > 0) 
            ? formatPrice(Number(product.sale_price)) 
            : '-';
        
        // 6. TỒN KHO
        const stock = safeNumber(product.stock, 0);
        
        // 7. ĐÃ BÁN - PHẢI LÀ SỐ!
        let salesCount = safeNumber(product.sales_count, 0);
        // Nếu sales_count là text "HOẠT ĐỘNG" thì đặt = 0
        if (typeof product.sales_count === 'string' && (product.sales_count === 'HOẠT ĐỘNG' || product.sales_count === 'HOAT DONG')) {
            salesCount = 0;
        }
        
        // 8. TRẠNG THÁI
        let status = safeString(product.status, 'active');
        if (status === 'active' && stock === 0) {
            status = 'out-of-stock';
        }
        const statusClass = status === 'active' ? 'confirmed' : status === 'out-of-stock' ? 'pending' : 'canceled';
        const statusLabel = status === 'active' ? 'Đang bán' : status === 'out-of-stock' ? 'Hết hàng' : 'Nháp';
        
        // 9. THAO TÁC
        const actionsHtml = `
            <div style="display: flex; gap: 8px; align-items: center; justify-content: center;">
                <button onclick="if(window.editProduct){window.editProduct(${productId})}" title="Sửa" style="cursor: pointer; padding: 6px; border: none; background: rgba(232, 213, 183, 0.2); border-radius: 6px; color: #a67c52; display: inline-flex; align-items: center; justify-content: center;">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
                <button onclick="if(window.deleteProduct){window.deleteProduct(${productId})}" title="Xóa" style="cursor: pointer; padding: 6px; border: none; background: rgba(239, 68, 68, 0.1); border-radius: 6px; color: #ef4444; display: inline-flex; align-items: center; justify-content: center;">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            </div>
        `;
        
        // TẠO ROW - CHỈ 9 CỘT, ĐÚNG THỨ TỰ THEO HEADER
        // Header: Hình ảnh | Tên sản phẩm | Loại | Giá | Giá KM | Tồn kho | Đã bán | Trạng thái | Thao tác
        const row = document.createElement('tr');
        row.setAttribute('data-product-id', productId);
        
        // Thêm từng cột một - KHÔNG có cột index, KHÔNG có số 1, 2, 3!
        row.appendChild(createCell('', imageHtml)); // 1. Hình ảnh
        row.appendChild(createCell('', `<strong>${escapeHtml(name)}</strong>`)); // 2. Tên sản phẩm
        row.appendChild(createCell('', category)); // 3. Loại
        row.appendChild(createCell('', price)); // 4. Giá
        row.appendChild(createCell('', salePrice)); // 5. Giá KM
        row.appendChild(createCell('', String(stock))); // 6. Tồn kho
        row.appendChild(createCell('', String(salesCount))); // 7. Đã bán (SỐ!)
        row.appendChild(createCell('', `<span class="admin-badge ${statusClass}">${escapeHtml(statusLabel)}</span>`)); // 8. Trạng thái
        row.appendChild(createCell('min-width: 100px;', actionsHtml)); // 9. Thao tác
        
        tbody.appendChild(row);
    });
    
    console.log('Products rendered, setting up actions...');
    
    // Re-setup actions after rendering
    setupProductActions();
}

/**
 * Open product modal
 */
function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    
    currentProductId = productId;
    const form = modal.querySelector('form');
    const modalTitle = modal.querySelector('h2');
    
    if (productId) {
        // Edit mode
        if (modalTitle) modalTitle.textContent = 'Sửa Sản phẩm';
    } else {
        // Create mode
        if (form) form.reset();
        if (modalTitle) modalTitle.textContent = 'Thêm Sản phẩm';
    }
    
    modal.style.display = 'flex';
}

/**
 * Close product modal
 */
function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentProductId = null;
    const form = modal?.querySelector('form');
    if (form) form.reset();
    
    // Reset image preview and show placeholder
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const placeholder = document.getElementById('imageUploadPlaceholder');
    const fileInput = document.getElementById('productImage');
    const uploadArea = document.getElementById('imageUploadArea');
    
    if (preview) preview.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (fileInput) fileInput.value = '';
    if (placeholder) placeholder.style.display = 'flex';
    if (uploadArea) {
        uploadArea.style.borderColor = '#e0e0e0';
        uploadArea.style.borderStyle = 'dashed';
    }
}

/**
 * Load categories from API
 */
let categoriesList = [];

async function loadCategories() {
    try {
        const response = await fetch('/api/categories/list.php', {
            method: 'GET',
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.categories) {
            categoriesList = result.data.categories;
            
            // Populate category dropdown in form
            const categorySelect = document.getElementById('productCategory');
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Chọn loại</option>';
                categoriesList.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    option.dataset.slug = cat.slug;
                    categorySelect.appendChild(option);
                });
            }
            
            // Populate category filter
            const categoryFilter = document.querySelector('.admin-filter-bar select[data-filter="category"]');
            if (categoryFilter) {
                categoryFilter.innerHTML = '<option value="">Tất cả</option>';
                categoriesList.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.slug;
                    option.textContent = cat.name;
                    categoryFilter.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

/**
 * Setup image upload with preview
 */
function setupImageUpload() {
    const imageInput = document.getElementById('productImage');
    const uploadArea = document.getElementById('imageUploadArea');
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (!imageInput || !uploadArea) return;
    
    // Click on upload area to trigger file input
    uploadArea.addEventListener('click', function(e) {
        if (e.target !== imageInput && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'IMG') {
            imageInput.click();
        }
    });
    
    // Handle file selection
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showNotification('Vui lòng chọn file ảnh (JPG, PNG, WEBP)', 'error');
                this.value = '';
                return;
            }
            
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                showNotification('Kích thước ảnh không được vượt quá 5MB', 'error');
                this.value = '';
                return;
            }
            
            // Show preview và ẩn placeholder
            showImagePreview(file);
        }
    });
    
    // Function to show image preview
    window.showImagePreview = function(file) {
        const placeholder = document.getElementById('imageUploadPlaceholder');
        const reader = new FileReader();
        reader.onload = function(e) {
            if (previewImg) {
                previewImg.src = e.target.result;
            }
            if (preview) {
                preview.style.display = 'block';
            }
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            if (uploadArea) {
                uploadArea.style.borderColor = '#10b981';
                uploadArea.style.borderStyle = 'solid';
            }
        };
        reader.readAsDataURL(file);
    };
    
    // Handle drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = '#3b82f6';
        this.style.backgroundColor = '#f0f9ff';
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = '#e0e0e0';
        this.style.backgroundColor = 'transparent';
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = '#e0e0e0';
        this.style.backgroundColor = 'transparent';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                // Validate file size (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showNotification('Kích thước ảnh không được vượt quá 5MB', 'error');
                    return;
                }
                
                imageInput.files = files;
                imageInput.dispatchEvent(new Event('change'));
            } else {
                showNotification('Vui lòng chọn file ảnh', 'error');
            }
        }
    });
}

/**
 * Setup add product form
 */
function setupAddProductForm() {
    const addBtn = document.querySelector('button[onclick*="openProductModal"]');
    const modal = document.getElementById('productModal');
    const form = modal?.querySelector('form');

    if (addBtn) {
        addBtn.onclick = () => openProductModal();
    }

    // Setup image upload with preview
    setupImageUpload();

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            
            // Check if image is selected
            const imageInput = document.getElementById('productImage');
            if (!currentProductId && imageInput && !imageInput.files[0]) {
                showNotification('Vui lòng chọn ảnh sản phẩm', 'error');
                return;
            }
            
            // Convert category_id (from select value) - already correct
            const categorySelect = document.getElementById('productCategory');
            const categoryId = categorySelect?.value;
            
            if (!categoryId) {
                showNotification('Vui lòng chọn loại sản phẩm', 'error');
                return;
            }
            
            // Clear category_slug, use category_id instead
            formData.delete('category_slug');
            formData.append('category_id', categoryId);
            
            // Add product ID if editing
            if (currentProductId) {
                formData.append('id', currentProductId);
            }
            
            // Validate required fields
            const name = formData.get('name');
            const price = formData.get('price');
            
            if (!name || !name.trim()) {
                showNotification('Vui lòng nhập tên sản phẩm', 'error');
                return;
            }
            
            if (!price || parseFloat(price) <= 0) {
                showNotification('Vui lòng nhập giá hợp lệ', 'error');
                return;
            }
            
            try {
                const submitBtn = form.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Đang lưu...';

                const endpoint = currentProductId 
                    ? '/api/admin/products/update.php'
                    : '/api/admin/products/create.php';

                const response = await fetch(endpoint, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    showNotification(
                        currentProductId ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!',
                        'success'
                    );
                    closeProductModal();
                    await loadAdminProducts();
                } else {
                    throw new Error(result.message || 'Lưu sản phẩm thất bại');
                }

            } catch (error) {
                console.error('Failed to save product:', error);
                showNotification(error.message || 'Lưu sản phẩm thất bại', 'error');
            } finally {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Lưu sản phẩm';
                }
            }
        });
    }
    
    // Make functions global
    window.openProductModal = openProductModal;
    window.closeProductModal = closeProductModal;
}

let currentProductId = null;

/**
 * Setup product actions (Edit & Delete)
 */
function setupProductActions() {
    // Remove existing listeners by cloning
    const tbody = document.querySelector('.admin-table tbody');
    if (!tbody) return;
    
    // Edit button handler
    tbody.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.onclick = async function() {
            const productId = parseInt(this.dataset.id);
            await editProduct(productId);
        };
    });
    
    // Delete button handler
    tbody.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.onclick = async function() {
            const productId = parseInt(this.dataset.id);
            await deleteProduct(productId);
        };
    });
}

/**
 * Edit product (Global function for onclick)
 */
async function editProduct(productId) {
    try {
        console.log('Editing product:', productId);
        
        // Load product detail
        const result = await window.API.products.detail(productId);
        
        if (!result || !result.product) {
            throw new Error('Không thể tải thông tin sản phẩm');
        }
        
        const product = result.product;
        currentProductId = productId;
        
        // Open modal and fill form
        openProductModal(productId);
        
        // Wait for modal to be visible
        setTimeout(() => {
            const form = document.getElementById('productForm');
            if (form) {
                // Fill form fields using IDs
                const nameInput = document.getElementById('productName');
                const priceInput = document.getElementById('productPrice');
                const stockInput = document.getElementById('productStock');
                const salePriceInput = document.getElementById('productSalePrice');
                const categorySelect = document.getElementById('productCategory');
                const descriptionTextarea = document.getElementById('productDescription');
                
                if (nameInput) nameInput.value = product.name || '';
                if (priceInput) priceInput.value = product.price || '';
                if (stockInput) stockInput.value = product.stock || '';
                if (salePriceInput) salePriceInput.value = product.sale_price || '';
                if (descriptionTextarea) descriptionTextarea.value = product.description || '';
                
                // Set category by category_id (not slug)
                if (categorySelect) {
                    const categoryId = product.category_id || product.category?.id;
                    if (categoryId) {
                        categorySelect.value = categoryId;
                    }
                }
                
                // Load and display current product image
                const imageUrl = product.image_url || product.image;
                if (imageUrl) {
                    const preview = document.getElementById('imagePreview');
                    const previewImg = document.getElementById('previewImg');
                    const placeholder = document.getElementById('imageUploadPlaceholder');
                    const uploadArea = document.getElementById('imageUploadArea');
                    
                    if (previewImg) {
                        // Nếu image_url là URL đầy đủ hoặc path tương đối
                        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/')) {
                            previewImg.src = imageUrl;
                        } else {
                            // Nếu chỉ là tên file, tạo URL
                            previewImg.src = '/api/uploads/products/' + imageUrl;
                        }
                    }
                    
                    if (preview) {
                        preview.style.display = 'block';
                    }
                    
                    if (placeholder) {
                        placeholder.style.display = 'none';
                    }
                    
                    if (uploadArea) {
                        uploadArea.style.borderColor = '#10b981';
                        uploadArea.style.borderStyle = 'solid';
                    }
                } else {
                    // Nếu không có ảnh, hiện placeholder
                    const preview = document.getElementById('imagePreview');
                    const placeholder = document.getElementById('imageUploadPlaceholder');
                    if (preview) preview.style.display = 'none';
                    if (placeholder) placeholder.style.display = 'flex';
                }
                
                // Update modal title
                const modalTitle = document.querySelector('#productModal h2');
                if (modalTitle) {
                    modalTitle.textContent = 'Sửa Sản phẩm';
                }
            }
        }, 100);
        
    } catch (error) {
        console.error('Failed to load product:', error);
        showNotification('Không thể tải thông tin sản phẩm: ' + error.message, 'error');
    }
}

/**
 * Delete product (Global function for onclick)
 */
async function deleteProduct(productId) {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác.')) {
        return;
    }

    try {
        console.log('Deleting product:', productId);
        
        const response = await fetch('/api/admin/products/delete.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
            body: JSON.stringify({ id: productId })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Xóa sản phẩm thành công!', 'success');
            await loadAdminProducts();
        } else {
            throw new Error(result.message || 'Xóa sản phẩm thất bại');
        }

    } catch (error) {
        console.error('Failed to delete product:', error);
        showNotification(error.message || 'Xóa sản phẩm thất bại', 'error');
    }
}

// Make functions global for onclick handlers
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    if (window.API && window.API.showNotification) {
        window.API.showNotification(message, type);
        return;
    }
    
    // Fallback notification
    const notification = document.createElement('div');
    notification.className = `admin-notification admin-notification-${type}`;
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
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Format price helper
 */
function formatPrice(price) {
    if (!price && price !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Store current filter state
let currentFilters = {
    search: '',
    category: '',
    status: '',
    order_by: 'created_at',
    order: 'DESC'
};

/**
 * Get current filter values from UI
 */
function getCurrentFilters() {
    // Reset filters, đọc lại từ UI (KHÔNG dùng currentFilters cũ)
    const filters = {
        search: '',
        category: '',
        status: '',
        order_by: 'created_at',
        order: 'DESC'
    };
    
    // Get search value
    const searchInput = document.querySelector('.admin-search-box input[type="text"]');
    if (searchInput) {
        filters.search = searchInput.value.trim();
    }
    
    // Get category filter
    const categoryFilter = document.querySelector('.admin-filter-bar .admin-filter-group:first-child select');
    if (categoryFilter) {
        filters.category = categoryFilter.value || '';
    }
    
    // Get status filter
    const statusFilter = document.querySelector('.admin-filter-bar .admin-filter-group:nth-child(2) select');
    if (statusFilter) {
        filters.status = statusFilter.value || '';
    }
    
    // Get sort filter
    const sortFilter = document.querySelector('.admin-filter-bar .admin-filter-group:nth-child(3) select');
    if (sortFilter) {
        const sort = sortFilter.value || 'newest';
        switch(sort) {
            case 'price-asc':
                filters.order_by = 'price';
                filters.order = 'ASC';
                break;
            case 'price-desc':
                filters.order_by = 'price';
                filters.order = 'DESC';
                break;
            case 'best-selling':
                filters.order_by = 'sales_count';
                filters.order = 'DESC';
                break;
            case 'newest':
            default:
                filters.order_by = 'created_at';
                filters.order = 'DESC';
                break;
        }
    }
    
    // Build params object, only include non-empty values
    // Khi chọn "Tất cả" (value = ""), sẽ KHÔNG gửi param đó, API sẽ hiển thị TẤT CẢ
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.status) params.status = filters.status;
    if (filters.order_by) params.order_by = filters.order_by;
    if (filters.order) params.order = filters.order;
    
    // Update currentFilters for reference
    currentFilters = filters;
    
    console.log('🔍 Current filters from UI:', filters);
    console.log('📤 Params to send:', params);
    
    return params;
}

/**
 * Setup filters
 */
function setupFilters() {
    // Search input
    const searchInput = document.getElementById('productSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    const searchLoading = document.getElementById('searchLoading');
    
    if (searchInput) {
        let searchTimeout;
        
        // Show/hide clear button based on input value
        function updateClearButton() {
            if (clearBtn) {
                clearBtn.style.display = searchInput.value.trim() ? 'block' : 'none';
            }
        }
        
        // Handle input change
        searchInput.addEventListener('input', function() {
            updateClearButton();
            
            // Show loading indicator
            if (searchLoading) {
                searchLoading.style.display = 'block';
            }
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const params = getCurrentFilters();
                performSearch(params);
            }, 500); // Debounce 500ms
        });
        
        // Handle Enter key
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(searchTimeout);
                const params = getCurrentFilters();
                performSearch(params);
            }
        });
        
        // Handle focus
        searchInput.addEventListener('focus', function() {
            updateClearButton();
        });
        
        // Initial check
        updateClearButton();
    }
    
    // Category filter
    const categoryFilter = document.querySelector('.admin-filter-bar .admin-filter-group:first-child select');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const params = getCurrentFilters();
            loadAdminProducts(params);
        });
    }
    
    // Status filter
    const statusFilter = document.querySelector('.admin-filter-bar .admin-filter-group:nth-child(2) select');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            const params = getCurrentFilters();
            loadAdminProducts(params);
        });
    }
    
    // Sort filter
    const sortFilter = document.querySelector('.admin-filter-bar .admin-filter-group:nth-child(3) select');
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            const params = getCurrentFilters();
            loadAdminProducts(params);
        });
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

