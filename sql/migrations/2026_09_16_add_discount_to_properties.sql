-- ==============================================================================
-- Migration: Add discount pricing columns to `properties` table
-- Date: 2026-09-16
-- Description:
--   1. Adds `original_price` (DECIMAL 12,2) for strikethrough original normal price
--   2. Adds `discount_percent` (INT) for discount badge percentage (e.g. 5%, 10%)
-- ==============================================================================

-- 1. Alter Table
ALTER TABLE `properties`
  ADD COLUMN `original_price` DECIMAL(12,2) NULL AFTER `price_per_night`,
  ADD COLUMN `discount_percent` INT NOT NULL DEFAULT 0 AFTER `original_price`;

-- 2. Populate Sample Discount Data for existing properties (Demonstration)
UPDATE `properties` 
SET `original_price` = 510000.00, `discount_percent` = 5 
WHERE `id` = 1;

UPDATE `properties` 
SET `original_price` = 466000.00, `discount_percent` = 10 
WHERE `id` = 2;

UPDATE `properties` 
SET `original_price` = 440000.00, `discount_percent` = 15 
WHERE `id` = 3;

UPDATE `properties` 
SET `original_price` = 720000.00, `discount_percent` = 10 
WHERE `id` = 4;

UPDATE `properties` 
SET `original_price` = 1600000.00, `discount_percent` = 10 
WHERE `id` = 7;

UPDATE `properties` 
SET `original_price` = 1470000.00, `discount_percent` = 15 
WHERE `id` = 8;
