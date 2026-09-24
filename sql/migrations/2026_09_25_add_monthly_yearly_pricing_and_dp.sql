-- ==============================================================================
-- Migration: 2026_09_25_add_monthly_yearly_pricing_and_dp.sql
-- Date: 2026-09-25
-- Description:
--   1. Add monthly & yearly pricing columns to `properties`:
--      - `price_per_month` DECIMAL(12,2) DEFAULT NULL
--      - `price_per_year` DECIMAL(12,2) DEFAULT NULL
--      - `monthly_discount_percent` INT DEFAULT 0
--      - `yearly_discount_percent` INT DEFAULT 0
--   2. Add DP (Down Payment) support and rental_type to `bookings`:
--      - Update `payment_status` enum to include 'dp_paid'
--      - `down_payment_amount` DECIMAL(12,2) DEFAULT 0.00
--      - `rental_type` ENUM('daily', 'monthly', 'yearly') DEFAULT 'daily'
-- ==============================================================================

SET @dbname = DATABASE();

-- 1. Table `properties`: Add `price_per_month`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'properties'
      AND COLUMN_NAME = 'price_per_month'
  ) > 0,
  'SELECT "Column price_per_month already exists in properties";',
  'ALTER TABLE `properties` ADD COLUMN `price_per_month` DECIMAL(12,2) DEFAULT NULL AFTER `discount_percent`;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add `monthly_discount_percent`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'properties'
      AND COLUMN_NAME = 'monthly_discount_percent'
  ) > 0,
  'SELECT "Column monthly_discount_percent already exists in properties";',
  'ALTER TABLE `properties` ADD COLUMN `monthly_discount_percent` INT NOT NULL DEFAULT 0 AFTER `price_per_month`;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add `price_per_year`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'properties'
      AND COLUMN_NAME = 'price_per_year'
  ) > 0,
  'SELECT "Column price_per_year already exists in properties";',
  'ALTER TABLE `properties` ADD COLUMN `price_per_year` DECIMAL(12,2) DEFAULT NULL AFTER `monthly_discount_percent`;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add `yearly_discount_percent`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'properties'
      AND COLUMN_NAME = 'yearly_discount_percent'
  ) > 0,
  'SELECT "Column yearly_discount_percent already exists in properties";',
  'ALTER TABLE `properties` ADD COLUMN `yearly_discount_percent` INT NOT NULL DEFAULT 0 AFTER `price_per_year`;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Table `bookings`: Update `payment_status` ENUM to include 'dp_paid'
ALTER TABLE `bookings` MODIFY COLUMN `payment_status` ENUM('pending_payment', 'waiting_approval', 'dp_paid', 'confirmed', 'rejected', 'cancelled', 'completed') NOT NULL DEFAULT 'pending_payment';

-- Add `down_payment_amount`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'bookings'
      AND COLUMN_NAME = 'down_payment_amount'
  ) > 0,
  'SELECT "Column down_payment_amount already exists in bookings";',
  'ALTER TABLE `bookings` ADD COLUMN `down_payment_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `grand_total`;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add `rental_type`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'bookings'
      AND COLUMN_NAME = 'rental_type'
  ) > 0,
  'SELECT "Column rental_type already exists in bookings";',
  'ALTER TABLE `bookings` ADD COLUMN `rental_type` ENUM(\'daily\', \'monthly\', \'yearly\') NOT NULL DEFAULT \'daily\' AFTER `down_payment_amount`;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing properties to set default monthly & yearly prices based on price_per_night
UPDATE `properties`
SET 
  `monthly_discount_percent` = 15,
  `price_per_month` = ROUND(`price_per_night` * 30 * 0.85),
  `yearly_discount_percent` = 25,
  `price_per_year` = ROUND(`price_per_night` * 365 * 0.75)
WHERE `price_per_month` IS NULL OR `price_per_month` = 0;

SELECT 'Migration 2026_09_25_add_monthly_yearly_pricing_and_dp completed successfully.' AS status;
