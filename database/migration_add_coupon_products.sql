-- Migration: Add coupon products table and apply_to field
-- Date: 2024

-- Add apply_to field to coupons table
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS apply_to VARCHAR(50) DEFAULT 'all' COMMENT 'all, banh-kem, hoa-tuoi, combo, qua-tang, specific';

-- Create coupon_products table for many-to-many relationship
CREATE TABLE IF NOT EXISTS coupon_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_coupon_product (coupon_id, product_id),
    INDEX idx_coupon (coupon_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

