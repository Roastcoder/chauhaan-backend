-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Apr 24, 2026 at 10:21 AM
-- Server version: 11.8.6-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u463483684_chauhaan`
--

-- --------------------------------------------------------

--
-- Table structure for table `banners`
--

CREATE TABLE `banners` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT '',
  `subtitle` text DEFAULT NULL,
  `image_url` text NOT NULL DEFAULT '',
  `cta_text` varchar(100) DEFAULT NULL,
  `cta_link` varchar(255) DEFAULT NULL,
  `page` varchar(50) NOT NULL DEFAULT 'home',
  `position` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `banner_type` varchar(50) NOT NULL DEFAULT 'hero',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `banners`
--

INSERT INTO `banners` (`id`, `title`, `subtitle`, `image_url`, `cta_text`, `cta_link`, `page`, `position`, `is_active`, `banner_type`, `created_at`, `updated_at`) VALUES
('93c800bd-8a59-4dd7-af52-c800c7cc41b8', 'Expert Repair & IT Services', 'Certified technicians for all brands', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80', 'Learn More', '/services', 'home', 2, 1, 'promo', '2026-04-20 06:52:31', '2026-04-20 06:52:31'),
('98c5a86e-385e-4719-ad8d-2f9c803db30c', '30 Days Hardware Warranty', 'On all products — terms apply', 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&q=80', 'Contact Us', '/contact', 'home', 3, 1, 'promo', '2026-04-20 06:52:31', '2026-04-20 06:52:31'),
('a8ee4be8-7614-4032-90f8-011fbac509c2', 'Premium Laptops & Desktops', 'Official Dell, HP, Lenovo & Apple Partner', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=80', 'Shop Now', '/category/dell-laptop', 'home', 1, 1, 'hero', '2026-04-20 06:52:31', '2026-04-20 06:52:31'),
('c4f7c9b8-ee20-4d8f-a06e-8d3bdf8b28c6', 'MacBook Air M2 — Now Available', 'Supercharged by M2 chip', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80', 'View MacBooks', '/category/macbook', 'home', 4, 1, 'hero', '2026-04-20 06:52:31', '2026-04-20 06:52:31');

-- --------------------------------------------------------

--
-- Table structure for table `call_history`
--

CREATE TABLE `call_history` (
  `id` varchar(36) NOT NULL,
  `lead_id` varchar(36) NOT NULL,
  `telecaller_id` varchar(36) NOT NULL,
  `outcome` varchar(50) NOT NULL,
  `remarks` text DEFAULT NULL,
  `duration_seconds` int(11) DEFAULT NULL,
  `follow_up_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `source` varchar(50) NOT NULL DEFAULT 'manual',
  `status` varchar(50) NOT NULL DEFAULT 'new',
  `product_interest` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `assigned_to` varchar(36) DEFAULT NULL,
  `customer_user_id` varchar(36) DEFAULT NULL,
  `follow_up_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leads`
--

INSERT INTO `leads` (`id`, `name`, `phone`, `email`, `source`, `status`, `product_interest`, `notes`, `assigned_to`, `customer_user_id`, `follow_up_at`, `created_at`, `updated_at`) VALUES
('8e247b39-7e33-4d69-86b0-2d92636374f0', 'Priya Mehta', '9123456789', 'customer@chauhaan.com', 'website', 'new', 'Dell Inspiron 15', NULL, '356dff36-1b5e-47c3-931f-4d1ef63c4d6e', 'e416b5fb-dc72-44a8-932b-c70e28b81805', NULL, '2026-04-20 05:49:41', '2026-04-20 05:59:02');

-- --------------------------------------------------------

--
-- Table structure for table `lead_remarks`
--

CREATE TABLE `lead_remarks` (
  `id` varchar(36) NOT NULL,
  `lead_id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `remark` text NOT NULL,
  `remark_type` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `loyalty_points`
--

CREATE TABLE `loyalty_points` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `points` int(11) NOT NULL DEFAULT 0,
  `lifetime_earned` int(11) NOT NULL DEFAULT 0,
  `lifetime_redeemed` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `loyalty_points`
--

INSERT INTO `loyalty_points` (`id`, `user_id`, `points`, `lifetime_earned`, `lifetime_redeemed`, `created_at`, `updated_at`) VALUES
('9046d621-7edf-4eed-be95-c6a8a8b69307', '3293623f-1bf1-4842-a959-3c51dc1cd8bd', 0, 0, 0, '2026-04-20 05:30:38', '2026-04-20 05:30:38'),
('a7e66a56-59f9-47a1-9311-bd431bcc1c0c', 'e416b5fb-dc72-44a8-932b-c70e28b81805', 250, 250, 0, '2026-04-20 05:18:02', '2026-04-20 05:18:02');

-- --------------------------------------------------------

--
-- Table structure for table `loyalty_transactions`
--

CREATE TABLE `loyalty_transactions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `points` int(11) NOT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'earn',
  `description` text DEFAULT NULL,
  `order_reference` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `newsletter_subscribers`
--

CREATE TABLE `newsletter_subscribers` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `newsletter_subscribers`
--

INSERT INTO `newsletter_subscribers` (`id`, `email`, `is_active`, `created_at`) VALUES
('66a43a9c-0eb2-4470-81df-a70faed24dec', 'sparshjain2828@gmail.om', 1, '2026-04-20 17:41:15');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(50) NOT NULL DEFAULT 'other',
  `brand` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `specs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`specs`)),
  `stock_quantity` int(11) DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `category`, `brand`, `price`, `description`, `images`, `specs`, `stock_quantity`, `is_active`, `created_at`, `updated_at`) VALUES
('64e7b313-7554-4358-b94d-bafd3d4578af', 'MacBookpro1', 'macbook', 'Apple', 50000.00, 'Apple', '[\"http://localhost:4000/uploads/1776674321348-gpjcvm3zrcl.webp\"]', '{}', 2, 1, '2026-04-20 06:11:02', '2026-04-20 08:38:42');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` varchar(36) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`value`)),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES
('1a037fb1-4da2-4fe9-b190-b9c532fadc36', 'store_info', '{\"name\":\"Chauhaan Computers\",\"address\":\"B-5  A , Vaibhav Enclave ,  Near Indian Bank , Girdhar Marg , Malviya Nagar , Jaipur , Rajasthan , 302017  \",\"phone\":\"098297 21157\",\"phone2\":\"\",\"phone3\":\"\",\"email\":\"\",\"hours\":\"Mon-Sat 10am-8pm\",\"whatsapp\":\"\",\"map_embed\":\"\",\"about_text\":\"\"}', '2026-04-20 13:50:15'),
('88eaf14b-a076-4795-8c3a-42db5305bf4b', 'loyalty_config', '{\"points_per_100_rupees\":1,\"point_value_rupees\":1,\"enabled\":true}', '2026-04-20 05:18:02'),
('90e0b195-c229-4eeb-aea0-0ba164c015ab', 'categories_config', '{\"cpu-desktop\":{\"visible\":true,\"customLabel\":\"CPU | Desktop Setup\",\"customSubtitle\":\"High Performance Builds\"},\"dell-laptop\":{\"visible\":true,\"customLabel\":\"Dell Laptop\",\"customSubtitle\":\"Official Partner & Sales\"},\"hp-laptop\":{\"visible\":true,\"customLabel\":\"HP Laptop\",\"customSubtitle\":\"Latest Models & Repair\"},\"lenovo-laptop\":{\"visible\":true,\"customLabel\":\"Lenovo Laptop\",\"customSubtitle\":\"Business & Gaming Series\"},\"macbook\":{\"visible\":true,\"customLabel\":\"MacBook\",\"customSubtitle\":\"Apple Certified Support\"},\"printers\":{\"visible\":true,\"customLabel\":\"Printers\",\"customSubtitle\":\"Service & Troubleshooting\"},\"keyboards\":{\"visible\":true,\"customLabel\":\"Keyboards\",\"customSubtitle\":\"Accessories\"},\"mouse\":{\"visible\":true,\"customLabel\":\"Mouse\",\"customSubtitle\":\"Accessories\"},\"headphones\":{\"visible\":true,\"customLabel\":\"Headphones & Headsets\",\"customSubtitle\":\"Accessories\"},\"webcams\":{\"visible\":true,\"customLabel\":\"Webcams\",\"customSubtitle\":\"Accessories\"},\"monitors\":{\"visible\":true,\"customLabel\":\"Monitors\",\"customSubtitle\":\"Accessories\"},\"speakers\":{\"visible\":true,\"customLabel\":\"Speakers\",\"customSubtitle\":\"Accessories\"},\"usb-hubs\":{\"visible\":true,\"customLabel\":\"USB Hubs & Adapters\",\"customSubtitle\":\"Accessories\"},\"bags\":{\"visible\":true,\"customLabel\":\"Bags & Sleeves\",\"customSubtitle\":\"Accessories\"},\"cables\":{\"visible\":true,\"customLabel\":\"Cables & Chargers\",\"customSubtitle\":\"Accessories\"},\"accessories-other\":{\"visible\":true,\"customLabel\":\"Other Accessories\",\"customSubtitle\":\"Accessories\"}}', '2026-04-20 08:49:27'),
('916ce8c3-8e08-4198-9e0b-81eddd2025a9', 'auto_assign', '{\"enabled\":false}', '2026-04-20 05:18:02'),
('bcf76106-bca0-45bc-9f49-d78075ee3ad7', 'site_flags', '{\"whatsapp_button\":true,\"emi_banner\":false,\"maintenance_mode\":false,\"newsletter_popup\":true}', '2026-04-20 07:24:02');

-- --------------------------------------------------------

--
-- Table structure for table `social_media_links`
--

CREATE TABLE `social_media_links` (
  `id` varchar(36) NOT NULL,
  `platform` varchar(50) NOT NULL,
  `url` varchar(255) NOT NULL,
  `icon_name` varchar(50) NOT NULL DEFAULT '',
  `display_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `social_media_links`
--

INSERT INTO `social_media_links` (`id`, `platform`, `url`, `icon_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
('08f80213-eae6-40d9-8769-168f0fc9242d', 'Instagram', 'https://instagram.com/chauhaan_computers', 'instagram', 1, 1, '2026-04-20 05:18:02', '2026-04-20 05:18:02'),
('63d1180c-52ab-46d9-b7b7-caaa9c28faf7', 'Facebook', 'https://facebook.com/chauhaan_computers', 'facebook', 2, 1, '2026-04-20 05:18:02', '2026-04-20 05:18:02');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL DEFAULT '',
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `avatar_url` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `role` varchar(20) NOT NULL DEFAULT 'customer',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `phone`, `address`, `avatar_url`, `is_active`, `role`, `created_at`, `updated_at`) VALUES
('3293623f-1bf1-4842-a959-3c51dc1cd8bd', 'test@gmail.com', '$2a$10$DbzDqeChzzA4z.DRJFQSSORqfIiorMXSoWR0UD3G79W81ELPI053m', 'Test', NULL, NULL, NULL, 1, 'customer', '2026-04-20 05:30:38', '2026-04-20 05:30:38'),
('356dff36-1b5e-47c3-931f-4d1ef63c4d6e', 'telecaller@chauhaan.com', '$2a$10$a1Gw4/BQS7mUBiHTVZWjVOHyfK3gayvhE8slJ7PQwHUmQNjVQ91pu', 'Rahul Sharma', '9876543210', NULL, NULL, 1, 'telecaller', '2026-04-20 05:18:02', '2026-04-20 05:18:02'),
('4277ab36-2227-4e99-961d-1473a18b8732', 'admin@chauhaan.com', '$2a$10$G2HsQOa2OjR4/9wt2zOwf.WeM/GC8TtyHvjROYBNF1cArCtAocMKy', 'Admin User', NULL, NULL, NULL, 1, 'admin', '2026-04-20 05:18:02', '2026-04-20 05:18:02'),
('e416b5fb-dc72-44a8-932b-c70e28b81805', 'customer@chauhaan.com', '$2a$10$lGI8G4truKgMUSo7VeEzz.4bDvji9I/Va4kUJ2whu27JNrDsAbB9y', 'Priya Mehta', '9123456789', NULL, NULL, 1, 'customer', '2026-04-20 05:18:02', '2026-04-20 05:18:02');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `call_history`
--
ALTER TABLE `call_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lead_remarks`
--
ALTER TABLE `lead_remarks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `loyalty_points`
--
ALTER TABLE `loyalty_points`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `loyalty_transactions`
--
ALTER TABLE `loyalty_transactions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `newsletter_subscribers`
--
ALTER TABLE `newsletter_subscribers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `key` (`key`);

--
-- Indexes for table `social_media_links`
--
ALTER TABLE `social_media_links`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
