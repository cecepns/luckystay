-- Database: luckystay_db
-- Generated for Lucky Stay Apartment & Hotel Booking Platform

CREATE DATABASE IF NOT EXISTS `luckystay_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `luckystay_db`;

-- Drop tables if exists
DROP TABLE IF EXISTS `hostex_logs`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `bank_accounts`;
DROP TABLE IF EXISTS `properties`;
DROP TABLE IF EXISTS `users`;

-- --------------------------------------------------------
-- Table structure for `users`
-- --------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(50) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  `avatar` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `properties`
-- --------------------------------------------------------
CREATE TABLE `properties` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `building_name` VARCHAR(255) DEFAULT NULL,
  `unit_number` VARCHAR(50) DEFAULT NULL,
  `location` VARCHAR(150) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `address` TEXT NOT NULL,
  `map_url` TEXT DEFAULT NULL,
  `type` ENUM('Studio', '1BR', '2BR', '3BR', 'Penthouse', 'Villa') NOT NULL DEFAULT 'Studio',
  `category` ENUM('Apartemen', 'Hotel', 'Villa') NOT NULL DEFAULT 'Apartemen',
  `price_per_night` DECIMAL(12,2) NOT NULL,
  `original_price` DECIMAL(12,2) DEFAULT NULL,
  `discount_percent` INT DEFAULT 0,
  `price_per_month` DECIMAL(12,2) DEFAULT NULL,
  `monthly_discount_percent` INT DEFAULT 0,
  `price_per_year` DECIMAL(12,2) DEFAULT NULL,
  `yearly_discount_percent` INT DEFAULT 0,
  `cleaning_fee` DECIMAL(12,2) NOT NULL DEFAULT 50000.00,
  `security_deposit` DECIMAL(12,2) NOT NULL DEFAULT 200000.00,
  `max_guests` INT NOT NULL DEFAULT 2,
  `bedrooms` INT NOT NULL DEFAULT 1,
  `beds` INT NOT NULL DEFAULT 1,
  `bathrooms` INT NOT NULL DEFAULT 1,
  `size_sqm` INT DEFAULT 32,
  `description` TEXT,
  `house_rules` TEXT,
  `amenities` JSON DEFAULT NULL,
  `images` JSON DEFAULT NULL,
  `hostex_property_id` VARCHAR(100) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_city` (`city`),
  INDEX `idx_location` (`location`),
  INDEX `idx_category` (`category`),
  INDEX `idx_price` (`price_per_night`),
  INDEX `idx_hostex_id` (`hostex_property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `bookings`
-- --------------------------------------------------------
CREATE TABLE `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_number` VARCHAR(60) NOT NULL UNIQUE,
  `property_id` INT NOT NULL,
  `user_id` INT NULL DEFAULT NULL,
  `guest_name` VARCHAR(150) NOT NULL,
  `guest_email` VARCHAR(150) NOT NULL,
  `guest_phone` VARCHAR(50) NOT NULL,
  `number_of_guests` INT NOT NULL DEFAULT 1,
  `check_in_date` DATE NOT NULL,
  `check_out_date` DATE NOT NULL,
  `total_nights` INT NOT NULL DEFAULT 1,
  `rental_type` ENUM('daily', 'monthly', 'yearly') NOT NULL DEFAULT 'daily',
  `room_price_per_night` DECIMAL(12,2) NOT NULL,
  `total_room_price` DECIMAL(12,2) NOT NULL,
  `cleaning_fee` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `security_deposit` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `grand_total` DECIMAL(12,2) NOT NULL,
  `down_payment_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `special_requests` TEXT DEFAULT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
  `payment_status` ENUM('pending_payment', 'waiting_approval', 'dp_paid', 'confirmed', 'rejected', 'cancelled', 'completed') NOT NULL DEFAULT 'pending_payment',
  `payment_proof_image` VARCHAR(255) DEFAULT NULL,
  `payment_proof_uploaded_at` TIMESTAMP NULL DEFAULT NULL,
  `admin_notes` TEXT DEFAULT NULL,
  `hostex_reservation_code` VARCHAR(100) DEFAULT NULL,
  `hostex_sync_status` ENUM('not_synced', 'synced', 'sync_failed', 'cancelled') NOT NULL DEFAULT 'not_synced',
  `hostex_sync_response` JSON DEFAULT NULL,
  `hostex_synced_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_invoice` (`invoice_number`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_payment_status` (`payment_status`),
  INDEX `idx_dates` (`check_in_date`, `check_out_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `bank_accounts`
-- --------------------------------------------------------
CREATE TABLE `bank_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bank_name` VARCHAR(100) NOT NULL,
  `account_number` VARCHAR(100) NOT NULL,
  `account_holder` VARCHAR(150) NOT NULL,
  `qris_image` VARCHAR(255) DEFAULT NULL,
  `instructions` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `hostex_logs`
-- --------------------------------------------------------
CREATE TABLE `hostex_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `status` ENUM('success', 'failed') NOT NULL,
  `request_payload` JSON DEFAULT NULL,
  `response_payload` JSON DEFAULT NULL,
  `error_message` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Seed Data for `users`
-- --------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`) VALUES
(1, 'Rian Hidayat', 'customer@luckystay.com', '+628123456789', '$2a$10$5MhL0Z8VqY14LhWvh0yZkeK3T3K4v3fVd/s6lXhD5.rA8H/F2Yw3a', 'customer');

-- --------------------------------------------------------
-- Seed Data for `bank_accounts`
-- --------------------------------------------------------
INSERT INTO `bank_accounts` (`bank_name`, `account_number`, `account_holder`, `qris_image`, `instructions`, `is_active`) VALUES
('BCA (Bank Central Asia)', '8720198822', 'PT LUCKY STAY INDONESIA', NULL, 'Transfer ke nomor rekening BCA di atas, simpan bukti transfer dan unggah di halaman invoice.', 1),
('Bank Mandiri', '1240019283741', 'PT LUCKY STAY INDONESIA', NULL, 'Transfer ke rekening Bank Mandiri, sertakan nomor invoice pada berita transfer.', 1),
('QRIS Lucky Stay', 'NMID: ID102003920192', 'LUCKY STAY OFFICIAL', '/uploads-luckystay/qris-sample.png', 'Scan QRIS Lucky Stay menggunakan GoPay, OVO, Dana, ShopeePay, BCA Mobile atau mobile banking lainnya.', 1);

-- --------------------------------------------------------
-- Seed Data for `properties`
-- --------------------------------------------------------
INSERT INTO `properties` (
  `id`, `name`, `slug`, `building_name`, `unit_number`, `location`, `city`, `address`, `map_url`, `type`, `category`, `price_per_night`, `cleaning_fee`, `security_deposit`, `max_guests`, `bedrooms`, `beds`, `bathrooms`, `size_sqm`, `description`, `house_rules`, `amenities`, `images`, `hostex_property_id`, `is_active`
) VALUES
(
  1,
  'Luxury Studio Casa Grande Residence - Tower Chianti',
  'luxury-studio-casa-grande-residence',
  'Casa Grande Residence',
  'Tower Chianti 22A',
  'Kota Kasablanka, Tebet',
  'Jakarta Selatan',
  'Jl. Raya Casablanca No.88, Menteng Dalam, Kec. Tebet, Kota Jakarta Selatan, DKI Jakarta 12870',
  'https://maps.google.com/?q=Casa+Grande+Residence+Jakarta',
  'Studio',
  'Apartemen',
  485000.00,
  60000.00,
  250000.00,
  2,
  1,
  1,
  1,
  38,
  'Apartemen Studio Modern & Mewah dengan akses langsung ke Mall Kota Kasablanka. Dilengkapi kasur King Koil Queen size, Smart TV 50 inch dengan Netflix, high speed WiFi 100 Mbps, kitchen set lengkap, dispenser, kulkas, dan balkon dengan pemandangan kota Jakarta.',
  'Dilarang merokok di dalam unit. Tidak diperkenankan membawa hewan peliharaan. Jam hening pukul 22:00 - 07:00.',
  '["High Speed WiFi", "Air Conditioner", "Smart TV + Netflix", "Kolam Renang Mewah", "Gym & Fitness", "Direct Mall Access", "Kitchen Set Lengkap", "Water Heater", "Kulkas", "Balkon City View", "24h Security & Access Card"]',
  '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"]',
  '1001',
  1
),
(
  2,
  'Cozy 2BR Green Pramuka City Modern Minimalist',
  'cozy-2br-green-pramuka-city',
  'Green Pramuka City',
  'Tower Orchid 15B',
  'Cempaka Putih',
  'Jakarta Pusat',
  'Jl. Jend. A. Yani Kav. 49, Rawasari, Cempaka Putih, Jakarta Pusat 10570',
  'https://maps.google.com/?q=Green+Pramuka+City',
  '2BR',
  'Apartemen',
  420000.00,
  50000.00,
  200000.00,
  4,
  2,
  2,
  1,
  45,
  'Unit 2 kamar tidur nyaman dan hemat di jantung Jakarta Pusat. Cocok untuk keluarga kecil atau perjalanan bisnis. Fasilitas lengkap: 2 kamar tidur AC, sofa bed, TV digital, kompor gas, kulkas, water heater, serta akses kolam renang olympic size dan mall di bawah gedung.',
  'Dilarang merokok di dalam kamar. Dilarang membawa obat terlarang / pesta liar.',
  '["WiFi Cepat", "AC di Setiap Kamar", "Smart TV", "Kolam Renang Olympic", "Mall & Food Court", "Kitchenette", "Water Heater", "Dispenser", "Security 24 Jam"]',
  '["https://images.unsplash.com/photo-1502005229762-ee1b2b93e083?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80"]',
  '1002',
  1
),
(
  3,
  'Aesthetic 1BR Sky House BSD City Near AEON Mall',
  'aesthetic-1br-sky-house-bsd-city',
  'Sky House BSD City',
  'Tower Leonor 18E',
  'BSD City, Serpong',
  'Tangerang',
  'Jl. BSD Raya Utama, CBD 55 - Lot III.1, Sampora, Cisauk, Tangerang 15345',
  'https://maps.google.com/?q=Sky+House+BSD+City',
  '1BR',
  'Apartemen',
  375000.00,
  50000.00,
  200000.00,
  2,
  1,
  1,
  1,
  35,
  'Nikmati staycation nyaman berkonsep resort di Sky House BSD City tepat di sebelah AEON Mall BSD dan ICE BSD. Menawarkan taman hijau tematik seluas 4.12 hektar, jogging track, kolam renang tropis, smart home features, serta interior estetik bernuansa Japandi.',
  'Dilarang merokok di dalam unit. Buang sampah pada tempatnya sebelum check out.',
  '["High Speed WiFi", "AC Inverter", "Smart TV 43 inch", "Smart Door Lock", "Kolam Renang Resort", "Gym & Yoga Lawn", "Kitchen Set & Microwave", "Water Heater", "AEON Mall Walkable"]',
  '["https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80"]',
  '1003',
  1
),
(
  4,
  'Premium 2BR The Maj Collections Dago Peak View',
  'premium-2br-the-maj-collections-dago',
  'The Maj Collections Dago',
  'North Tower 12C',
  'Dago Atas',
  'Bandung',
  'Jl. Ir. H. Juanda No.474, Dago, Coblong, Kota Bandung, Jawa Barat 40135',
  'https://maps.google.com/?q=The+Maj+Dago+Bandung',
  '2BR',
  'Apartemen',
  650000.00,
  75000.00,
  300000.00,
  4,
  2,
  2,
  2,
  62,
  'Apartemen mewah di kawasan sejuk Dago Atas Bandung dengan pemandangan pegunungan dan panorama lampu kota (city lights) yang menakjubkan. Dilengkapi infinity pool berpemanas air hangat, 2 kamar tidur lega, interior kayu premium, dan balkon luas santai.',
  'Dilarang merokok. Tidak diizinkan membuat keributan setelah jam 22.00.',
  '["WiFi Cepat", "Heated Infinity Pool", "Smart TV 55 inch", "AC & Air Purifier", "Kulkas 2 Pintu", "Balkon Pegunungan", "Peralatan Masak Lengkap", "Water Heater", "Security 24 Jam"]',
  '["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80"]',
  '1004',
  1
),
(
  5,
  'Tropical Villa Deluxe Canggu Sunset Sanctuary',
  'tropical-villa-deluxe-canggu',
  'Lucky Stay Canggu Villas',
  'Villa No. 03',
  'Batu Bolong, Canggu',
  'Bali',
  'Jl. Pantai Batu Bolong No.22, Canggu, Kec. Kuta Utara, Kabupaten Badung, Bali 80361',
  'https://maps.google.com/?q=Batu+Bolong+Canggu+Bali',
  'Villa',
  'Villa',
  1250000.00,
  100000.00,
  500000.00,
  4,
  2,
  2,
  2,
  120,
  'Private tropical villa dengan kolam renang pribadi di pusat Canggu. Hanya 5 menit berkendara ke Pantai Batu Bolong & Echo Beach. Suasana tenang dengan taman tropis, outdoor living area terbuka, dapur modern, dan kamar mandi semi-terbuka gaya Bali.',
  'Dilarang mengadakan party tanpa persetujuan. Dilarang merokok di area kamar tidur ber-AC.',
  '["Private Swimming Pool", "High Speed Fiber WiFi 150 Mbps", "AC di Setiap Kamar", "Semi-outdoor Bathroom with Bathtub", "Modern Kitchen & Bar", "Daily Housekeeping", "Balkon & Sunbed", "Motorbike Parking"]',
  '["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"]',
  '1005',
  1
),
(
  6,
  'Grand Penthouse Pavilion Pakuwon Mall Surabaya',
  'grand-penthouse-pakuwon-mall-surabaya',
  'Orchard Mansion Pakuwon',
  'Tower B Penthouse 38F',
  'Pakuwon Indah',
  'Surabaya',
  'Jl. Puncak Indah Lontar No.2, Babatan, Wiyung, Kota Surabaya, Jawa Timur 60227',
  'https://maps.google.com/?q=Pakuwon+Mall+Surabaya',
  'Penthouse',
  'Apartemen',
  1150000.00,
  100000.00,
  500000.00,
  6,
  3,
  3,
  3,
  110,
  'Penthouse eksklusif 3 kamar tidur langsung di atas Pakuwon Mall Surabaya Barat. Menawarkan pemandangan kota 180 derajat yang luar biasa dari lantai tertinggi, jacuzzi pribadi, perabot marmer mewah, dan akses privat ke ballroom dan kolam renang rooftop.',
  'Dilarang merokok. Hewan peliharaan tidak diperbolehkan. Dilarang membuat keributan di atas jam 22.00.',
  '["Direct Access Pakuwon Mall", "Private Jacuzzi", "WiFi 200 Mbps", "AC Central", "Rooftop Sky Pool", "Kitchen Set Premium", "Mesin Cuci & Dryer", "Smart Lock & Security Card"]',
  '["https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80"]',
  '1006',
  1
),
(
  7,
  'The Langham Suite SCBD Sudirman View',
  'the-langham-suite-scbd-sudirman',
  'The Langham Jakarta',
  'Suite 2501',
  'SCBD, Senayan',
  'Jakarta Selatan',
  'District 8 SCBD, Senayan, Kebayoran Baru, Jakarta Selatan',
  'https://maps.google.com/?q=The+Langham+Jakarta',
  'Studio',
  'Hotel',
  1450000.00,
  0.00,
  500000.00,
  2,
  1,
  1,
  1,
  65,
  'Hotel suite mewah bintang 5 di pusat bisnis SCBD Jakarta dengan pemandangan cakrawala kota Sudirman yang megah. Termasuk sarapan internasional, infinity pool di lantai tertinggi, dan akses Chuan Spa.',
  'Check-in pukul 14:00, Check-out 12:00. Dilarang merokok di dalam kamar suite.',
  '["Sarapan Mewah Termasuk", "Infinity Rooftop Pool", "High Speed WiFi", "Bathtub Mewah Marmer", "Smart TV 65 inch", "AC Central", "Minibar Gratis", "Butler Service 24 Jam", "Gym Bintang 5"]',
  '["https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"]',
  '1007',
  1
),
(
  8,
  'Padma Valley Resort Deluxe Bandung',
  'padma-valley-resort-deluxe-bandung',
  'Padma Hotel Bandung',
  'Premier Suite 308',
  'Ciumbuleuit',
  'Bandung',
  'Jl. Rancabentang No.56-58, Ciumbuleuit, Kec. Cidadap, Kota Bandung',
  'https://maps.google.com/?q=Padma+Hotel+Bandung',
  'Studio',
  'Hotel',
  1250000.00,
  0.00,
  300000.00,
  3,
  1,
  2,
  1,
  52,
  'Resort hotel legendaris di perbukitan hijau Ciumbuleuit Bandung. Menawarkan udara sejuk pegunungan, pemandangan lembah spektakuler, kolam renang air hangat berpemanas terbuka ke alam, dan afternoon tea santai.',
  'Dilarang merokok di area tertutup. Hewan peliharaan tidak diperbolehkan.',
  '["Heated Open-air Pool", "Valley Green View", "Afternoon Tea Gratis", "Smart TV", "King Size Bed", "Balcony Santai", "WiFi Cepat", "Kids Activity Area", "Sarapan Prasmanan"]',
  '["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"]',
  '1008',
  1
);

-- --------------------------------------------------------
-- Seed Data for `bookings`
-- --------------------------------------------------------
INSERT INTO `bookings` (
  `id`, `invoice_number`, `property_id`, `user_id`, `guest_name`, `guest_email`, `guest_phone`, `number_of_guests`, `check_in_date`, `check_out_date`, `total_nights`, `room_price_per_night`, `total_room_price`, `cleaning_fee`, `security_deposit`, `grand_total`, `special_requests`, `payment_method`, `payment_status`, `payment_proof_image`, `payment_proof_uploaded_at`, `admin_notes`, `hostex_reservation_code`, `hostex_sync_status`, `created_at`
) VALUES
(
  1,
  'INV-LS20260910-001',
  1,
  1,
  'Rian Hidayat',
  'customer@luckystay.com',
  '+628123456789',
  2,
  '2026-09-20',
  '2026-09-23',
  3,
  485000.00,
  1455000.00,
  60000.00,
  250000.00,
  1765000.00,
  'Mohon disiapkan handuk ekstra dan lantai bebas rokok.',
  'bank_transfer',
  'confirmed',
  NULL,
  '2026-09-10 14:20:00',
  'Pembayaran telah diverifikasi via rekening BCA.',
  'HTX-20260910-9921',
  'synced',
  '2026-09-10 14:15:00'
),
(
  2,
  'INV-LS20260912-002',
  2,
  NULL,
  'Siti Nurhaliza',
  'siti.nur@example.com',
  '+6281987654321',
  3,
  '2026-09-25',
  '2026-09-27',
  2,
  420000.00,
  840000.00,
  50000.00,
  200000.00,
  1090000.00,
  'Check-in sekitar pukul 15.00 WIB.',
  'bank_transfer',
  'waiting_approval',
  NULL,
  '2026-09-12 09:30:00',
  'Menunggu pengecekan mutasi bank oleh finance.',
  NULL,
  'not_synced',
  '2026-09-12 09:10:00'
),
(
  3,
  'INV-LS20260914-003',
  4,
  NULL,
  'Dimas Prasetyo',
  'dimas.pras@example.com',
  '+6285612348888',
  4,
  '2026-10-02',
  '2026-10-04',
  2,
  650000.00,
  1300000.00,
  75000.00,
  300000.00,
  1675000.00,
  'Early check-in bila memungkinkan.',
  'bank_transfer',
  'pending_payment',
  NULL,
  NULL,
  NULL,
  NULL,
  'not_synced',
  '2026-09-14 10:00:00'
);

-- --------------------------------------------------------
-- Table structure for `cities`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Table structure for `property_types`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Table structure for `reviews`
-- --------------------------------------------------------
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

