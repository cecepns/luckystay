-- ==============================================================================
-- Migration: 2026_09_21_update_tables_and_cleanup.sql
-- Date: 2026-09-21
-- Description:
--   1. Ensure `properties` table has discount & Hostex mapping columns:
--      - `original_price` DECIMAL(12,2) DEFAULT NULL
--      - `discount_percent` INT DEFAULT 0
--      - `hostex_property_id` VARCHAR(100) DEFAULT NULL
--   2. Clean up invalid `qris_image` data (`[object Object]`) in `bank_accounts`
--   3. Ensure `bank_accounts` table structure has `qris_image` VARCHAR(255)
--   4. Ensure `bookings` table has Hostex tracking columns
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Table `properties`: Add discount and Hostex columns (if not already present)
-- ------------------------------------------------------------------------------
SET @dbname = DATABASE();

-- Add `original_price`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'properties'
      AND COLUMN_NAME = 'original_price'
  ) > 0,
  'SELECT "Column original_price already exists in properties";',
  'ALTER TABLE `properties` ADD COLUMN `original_price` DECIMAL(12,2) DEFAULT NULL AFTER `price_per_night`;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add `discount_percent`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'properties'
      AND COLUMN_NAME = 'discount_percent'
  ) > 0,
  'SELECT "Column discount_percent already exists in properties";',
  'ALTER TABLE `properties` ADD COLUMN `discount_percent` INT NOT NULL DEFAULT 0 AFTER `original_price`;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add `hostex_property_id`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'properties'
      AND COLUMN_NAME = 'hostex_property_id'
  ) > 0,
  'SELECT "Column hostex_property_id already exists in properties";',
  'ALTER TABLE `properties` ADD COLUMN `hostex_property_id` VARCHAR(100) DEFAULT NULL AFTER `amenities`;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 2. Table `bank_accounts`: Clean up broken `[object Object]` values & ensure schema
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bank_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bank_name` VARCHAR(100) NOT NULL,
  `account_number` VARCHAR(100) NOT NULL,
  `account_holder` VARCHAR(150) NOT NULL,
  `qris_image` VARCHAR(255) DEFAULT NULL,
  `instructions` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clean up any legacy or broken '[object Object]' strings saved previously
UPDATE `bank_accounts`
SET `qris_image` = NULL
WHERE `qris_image` = '[object Object]'
   OR `qris_image` = ''
   OR `qris_image` LIKE '%object Object%';

-- ------------------------------------------------------------------------------
-- 3. Table `bookings`: Ensure Hostex sync columns exist
-- ------------------------------------------------------------------------------
-- Add `hostex_reservation_code`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'bookings'
      AND COLUMN_NAME = 'hostex_reservation_code'
  ) > 0,
  'SELECT "Column hostex_reservation_code already exists in bookings";',
  'ALTER TABLE `bookings` ADD COLUMN `hostex_reservation_code` VARCHAR(100) DEFAULT NULL;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add `hostex_sync_status`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'bookings'
      AND COLUMN_NAME = 'hostex_sync_status'
  ) > 0,
  'SELECT "Column hostex_sync_status already exists in bookings";',
  'ALTER TABLE `bookings` ADD COLUMN `hostex_sync_status` ENUM(\'not_synced\', \'synced\', \'sync_failed\', \'cancelled\') NOT NULL DEFAULT \'not_synced\';'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add `hostex_sync_response`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'bookings'
      AND COLUMN_NAME = 'hostex_sync_response'
  ) > 0,
  'SELECT "Column hostex_sync_response already exists in bookings";',
  'ALTER TABLE `bookings` ADD COLUMN `hostex_sync_response` JSON DEFAULT NULL;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add `hostex_synced_at`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'bookings'
      AND COLUMN_NAME = 'hostex_synced_at'
  ) > 0,
  'SELECT "Column hostex_synced_at already exists in bookings";',
  'ALTER TABLE `bookings` ADD COLUMN `hostex_synced_at` TIMESTAMP NULL DEFAULT NULL;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 4. Log migration completion
-- ------------------------------------------------------------------------------
SELECT 'Migration 2026_09_21_update_tables_and_cleanup completed successfully.' AS status;
