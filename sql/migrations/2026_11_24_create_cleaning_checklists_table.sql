-- ------------------------------------------------------------------------------
-- Migration: Create cleaning_checklists table for Daily After Cleaning Reports
-- Date: 2026-11-24
-- Description: Stores daily apartment cleaning inspection reports submitted by housekeeping
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `cleaning_checklists` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `report_code` VARCHAR(60) NOT NULL UNIQUE,
  `cleaning_date` DATE NOT NULL,
  `cleaner_name` VARCHAR(150) NOT NULL,
  `property_name` VARCHAR(200) NOT NULL,
  `unit_number` VARCHAR(100) NOT NULL,
  `unit_status` VARCHAR(50) NOT NULL DEFAULT 'Siap Huni',
  `start_time` VARCHAR(20) DEFAULT NULL,
  `end_time` VARCHAR(20) DEFAULT NULL,
  `checklist_items` JSON NOT NULL,
  `total_items` INT NOT NULL DEFAULT 27,
  `completed_items` INT NOT NULL DEFAULT 0,
  `completion_percent` INT NOT NULL DEFAULT 0,
  `damage_notes` TEXT DEFAULT NULL,
  `additional_notes` TEXT DEFAULT NULL,
  `photo_bedroom` VARCHAR(255) DEFAULT NULL,
  `photo_bathroom` VARCHAR(255) DEFAULT NULL,
  `photo_living_room` VARCHAR(255) DEFAULT NULL,
  `photo_kitchen` VARCHAR(255) DEFAULT NULL,
  `photo_overview` VARCHAR(255) DEFAULT NULL,
  `video_url` VARCHAR(255) DEFAULT NULL,
  `is_confirmed` TINYINT(1) NOT NULL DEFAULT 1,
  `confirmed_by` VARCHAR(150) DEFAULT NULL,
  `admin_notes` TEXT DEFAULT NULL,
  `verified_by` VARCHAR(150) DEFAULT NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cleaning_date` (`cleaning_date`),
  INDEX `idx_cleaner_name` (`cleaner_name`),
  INDEX `idx_property_name` (`property_name`),
  INDEX `idx_unit_status` (`unit_status`),
  INDEX `idx_is_verified` (`is_verified`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
