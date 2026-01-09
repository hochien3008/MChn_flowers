-- Migration: Add category column to blog_posts
-- Date: 2026-01

ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT NULL AFTER slug;
