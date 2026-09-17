-- ==============================================================================
-- Migration: Cities, Property Types, Reviews, and Admin User Setup
-- Date: 2026-09-16
-- ==============================================================================

-- 1. Create `cities` Table
CREATE TABLE IF NOT EXISTS `cities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `province` VARCHAR(100) DEFAULT 'Indonesia',
  `image` VARCHAR(255) DEFAULT NULL,
  `is_popular` TINYINT(1) NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_city_name` (`name`),
  INDEX `idx_city_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default cities
INSERT INTO `cities` (`name`, `slug`, `province`, `is_popular`, `is_active`) VALUES
('Jakarta Selatan', 'jakarta-selatan', 'DKI Jakarta', 1, 1),
('Jakarta Pusat', 'jakarta-pusat', 'DKI Jakarta', 1, 1),
('Tangerang', 'tangerang', 'Banten', 1, 1),
('Bandung', 'bandung', 'Jawa Barat', 1, 1),
('Bali', 'bali', 'Bali', 1, 1),
('Surabaya', 'surabaya', 'Jawa Timur', 1, 1)
ON DUPLICATE KEY UPDATE `is_active` = 1;

-- 2. Create `property_types` Table
CREATE TABLE IF NOT EXISTS `property_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(150) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_type_name` (`name`),
  INDEX `idx_type_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default property types
INSERT INTO `property_types` (`name`, `description`, `is_active`) VALUES
('Studio', 'Tipe Studio (1 Kamar / Terbuka)', 1),
('1BR', '1 Kamar Tidur (One Bedroom)', 1),
('2BR', '2 Kamar Tidur (Two Bedroom)', 1),
('3BR', '3 Kamar Tidur (Three Bedroom)', 1),
('Penthouse', 'Unit Mewah Lantai Atas', 1),
('Villa', 'Villa Mewah Eksklusif', 1)
ON DUPLICATE KEY UPDATE `is_active` = 1;

-- 3. Ensure `bank_accounts` Table has necessary columns
CREATE TABLE IF NOT EXISTS `bank_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bank_name` VARCHAR(100) NOT NULL,
  `account_number` VARCHAR(100) NOT NULL,
  `account_holder` VARCHAR(150) NOT NULL,
  `qris_image` VARCHAR(255) DEFAULT NULL,
  `instructions` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create `reviews` Table
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `property_id` INT DEFAULT NULL,
  `user_id` INT DEFAULT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `user_avatar` VARCHAR(255) DEFAULT NULL,
  `user_role_label` VARCHAR(100) DEFAULT 'Tamu Terverifikasi',
  `rating` INT NOT NULL DEFAULT 5,
  `comment` TEXT NOT NULL,
  `is_approved` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_review_approved` (`is_approved`),
  INDEX `idx_review_property` (`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default reviews
INSERT INTO `reviews` (`user_name`, `user_role_label`, `rating`, `comment`, `is_approved`) VALUES
('Aditya Rahardian', 'Tamu Bisnis • Casa Grande Jakarta', 5, 'Unit di Casa Grande Tebet luar biasa bersih! Akses langsung ke mall bikin gampang cari makan. Proses depositnya juga dikembalikan sangat cepat tanpa ribet.', 1),
('Sabrina Kusuma', 'Liburan Keluarga • Villa Canggu Bali', 5, 'Villa Canggu Bali benar-benar private dan kolam renangnya bersih banget. Fasilitas dapurnya lengkap, WiFi kencang buat kerja santai. Pasti bakal balik lagi!', 1),
('Fikri Nugroho', 'Staycation • Sky House BSD', 5, 'Sangat terbantu dengan fitur Cek Budget dan CS WhatsApp yang responsif jam 11 malam sekalipun saat check-in mandiri. Pelayanan terbaik!', 1),
('Maya Anggraini', 'Tamu Liburan • The Maj Bandung', 5, 'Pemandangan Dago Peak dari balkon unit lantai 12 luar biasa indah di malam hari. Interiornya estetik banget dan stafnya ramah.', 1);

-- 5. Insert/Ensure Default Admin Account in `users`
INSERT INTO `users` (`name`, `email`, `phone`, `password`, `role`) 
VALUES (
  'Administrator Lucky Stay', 
  'admin@luckystay.com', 
  '081234567890', 
  '$2b$10$Zp0Knx/9qqGNdhIHq9sdbe5mrV7Dvvf/Po.OGPIlYnnTGWF/Lnx/u', 
  'admin'
)
ON DUPLICATE KEY UPDATE `role` = 'admin', `password` = '$2b$10$Zp0Knx/9qqGNdhIHq9sdbe5mrV7Dvvf/Po.OGPIlYnnTGWF/Lnx/u';
