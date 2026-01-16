/**
 * Product Detail Interactions
 */

// Gallery Interaction
function changeImage(src) {
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.src = src;
        mainImage.style.opacity = '0';
        setTimeout(() => {
            mainImage.style.opacity = '1';
        }, 50);
    }

    // Update active state
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
        if (thumb.querySelector('img').src === src) {
            thumb.classList.add('active');
        }
    });
}

// Quantity Control
function updateQty(change) {
    const qtyInput = document.getElementById('qtyInput');
    if (qtyInput) {
        let newVal = parseInt(qtyInput.value) + change;
        if (newVal < 1) newVal = 1;
        qtyInput.value = newVal;
    }
}

// Tab Switching
function switchTab(tabId) {
    // Hide all contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected content & activate button
    const selectedContent = document.getElementById(tabId);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }

    // Find the button that called this function - tricky without 'this', so we query by onclick attribute or text
    // Simpler: iterate buttons and check if onclick matches
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(btn => {
        if (btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active');
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Optional: Load dynamic data here if needed in future
    // console.log('Product Detail loaded');
});

