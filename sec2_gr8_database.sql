-- sec2_gr8 BuddyGiftfy: native MySQL 8 demo database
-- All accounts are DEMO ONLY. See README.md. No real shop credentials/customer data.
CREATE DATABASE IF NOT EXISTS buddygiftfy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE buddygiftfy;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS=0;
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `log_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` bigint unsigned DEFAULT NULL,
  `customer_id` bigint unsigned DEFAULT NULL,
  `action` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('Success','Failed','Pending') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Success',
  `device` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `fk_logs_customer` (`customer_id`),
  KEY `idx_logs_created` (`created_at`),
  KEY `idx_logs_admin` (`admin_id`,`created_at`),
  CONSTRAINT `fk_logs_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin_accounts` (`admin_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_logs_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `activity_logs` (`log_id`,`admin_id`,`customer_id`,`action`,`description`,`ip_address`,`status`,`device`,`created_at`) VALUES (1,1,NULL,'admin.login','Signed in','::ffff:127.0.0.1','Success','node','2026-11-09 07:53:58');
INSERT INTO `activity_logs` (`log_id`,`admin_id`,`customer_id`,`action`,`description`,`ip_address`,`status`,`device`,`created_at`) VALUES (2,2,NULL,'admin.login','Signed in','::ffff:127.0.0.1','Success','node','2026-11-09 07:53:58');
CREATE TABLE IF NOT EXISTS `admin_accounts` (
  `admin_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('Owner','Manager','Editor') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Editor',
  `status` enum('Active','Inactive','Suspended') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `age` smallint unsigned DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `preferences` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `admin_accounts` (`admin_id`,`email`,`password_hash`,`first_name`,`last_name`,`role`,`status`,`created_at`,`updated_at`,`age`,`address`,`preferences`) VALUES (1,'owner@example.test','scrypt$facbe4cdd8c620fae3f6b8ada6e6cb9e$10d6bea69acd560dba255a084a1254a304d22838959c06e8114fbdf0617005ceea9f99bed062a89cf1fdee7a2d4b6b05e1486d4b5282e49f295871e8d132a155','Demo','Owner','Owner','Active','2026-11-09 07:53:58','2026-11-09 07:53:58',22,'ที่อยู่ร้านตัวอย่างสำหรับสาธิตโครงการ','ดูแลสินค้า คำสั่งซื้อ และสมาชิกทีม');
INSERT INTO `admin_accounts` (`admin_id`,`email`,`password_hash`,`first_name`,`last_name`,`role`,`status`,`created_at`,`updated_at`,`age`,`address`,`preferences`) VALUES (2,'manager@example.test','scrypt$3a067075e06f535bfd286b3900f2581f$1237a876e28ee2734359d87b2b241e0cae65f93a8fb0c4f1bd6248590e985d00a4e4974fd10fd1c9a60f29cb3df5c325fbd9558d1705533d9e2b25fbf206ff5f','Demo Manager','Sample','Manager','Active','2026-11-09 07:53:58','2026-11-09 07:53:58',23,'ที่อยู่ตัวอย่างสำหรับโครงการ','ตรวจสลิปและดูแลการจัดส่ง');
INSERT INTO `admin_accounts` (`admin_id`,`email`,`password_hash`,`first_name`,`last_name`,`role`,`status`,`created_at`,`updated_at`,`age`,`address`,`preferences`) VALUES (3,'editor@example.test','scrypt$b624dc917e5e1c5b0365d9cefa7df501$df62d25daa36ae39958e303bee6a6497a2839102d0a0cdb0dc7bfb1274997f2d75e32c5600f9eb6e6623b046e171396deaee69e54e8bc706994e4e67f171bbb9','Demo Editor','Sample','Editor','Active','2026-11-09 07:53:58','2026-11-09 07:53:58',21,'ที่อยู่ตัวอย่างสำหรับโครงการ','ดูแลรายละเอียดสินค้าและสต็อก');
CREATE TABLE IF NOT EXISTS `categories` (
  `category_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  `is_custom` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `categories` (`category_id`,`name`,`sort_order`,`is_custom`,`created_at`,`updated_at`) VALUES (1,'ตุ๊กตา',0,0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `categories` (`category_id`,`name`,`sort_order`,`is_custom`,`created_at`,`updated_at`) VALUES (2,'ของขวัญสั่งทำ',0,1,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `categories` (`category_id`,`name`,`sort_order`,`is_custom`,`created_at`,`updated_at`) VALUES (4,'ของแต่งบ้าน',0,0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `categories` (`category_id`,`name`,`sort_order`,`is_custom`,`created_at`,`updated_at`) VALUES (5,'ดอกไม้',0,0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `categories` (`category_id`,`name`,`sort_order`,`is_custom`,`created_at`,`updated_at`) VALUES (7,'ของสะสม',0,0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `message_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('New','Read','Resolved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'New',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  KEY `idx_messages_status_date` (`status`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `status` enum('Active','Inactive','Suspended') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_customers_status` (`status`),
  KEY `idx_customers_name` (`last_name`,`first_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `order_items` (
  `order_item_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `product_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `quantity` int unsigned NOT NULL,
  `line_total` decimal(10,2) NOT NULL,
  `custom_note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`order_item_id`),
  UNIQUE KEY `uq_order_product` (`order_id`,`product_id`),
  KEY `fk_order_items_product` (`product_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `status` enum('Pending','Confirmed','Preparing','Shipped','Completed','Cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `subtotal` decimal(10,2) NOT NULL,
  `gift_wrap_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_price` decimal(10,2) NOT NULL,
  `gift_wrap` tinyint(1) NOT NULL DEFAULT '0',
  `gift_message` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_phone` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tracking_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_carrier` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `checkout_key` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `order_number` (`order_number`),
  UNIQUE KEY `uq_orders_checkout` (`checkout_key`),
  KEY `idx_orders_status_date` (`status`,`created_at`),
  KEY `idx_orders_customer` (`customer_id`,`created_at`),
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `provider_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Manual bank transfer',
  `payment_status` enum('Pending','Completed','Failed','Refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `deadline` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `proof_path` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `review_note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `fk_payments_order` (`order_id`),
  KEY `idx_payments_status` (`payment_status`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `products` (
  `product_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sku` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '/images/product-placeholder.svg',
  `price` decimal(10,2) NOT NULL,
  `stock_quantity` int unsigned NOT NULL DEFAULT '0',
  `status` enum('Available','Out of stock','Inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Available',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_products_status_category` (`status`,`category`),
  KEY `idx_products_featured` (`is_featured`,`status`),
  KEY `fk_products_category` (`category`),
  FULLTEXT KEY `ft_products_search` (`name`,`description`,`category`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category`) REFERENCES `categories` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_products_price` CHECK ((`price` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (1,'BG-000001','buddy-bear','Buddy Bear','ตุ๊กตาหมีขนนุ่ม ของขวัญแทนความรู้สึกอบอุ่น พร้อมส่งมอบรอยยิ้มในทุกโอกาส','ตุ๊กตา','/images/asset-image17.png','850.00',18,'Available',1,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (2,'BG-000002','custom-face-pillow','หมอน custom รูปหน้าคน','หมอนสั่งทำพิเศษ เลือกรูปที่ชอบแล้วเปลี่ยนให้เป็นของขวัญชิ้นเดียวในโลก ขนาด 60 × 30 ซม.','ของขวัญสั่งทำ','/images/custom-pillow.png','290.00',24,'Available',1,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (3,'BG-000003','mini-lego-cake','Lego เค้กจิ๋ว','เซตตัวต่อเค้กขนาดน่ารัก เพิ่มรูปหรือข้อความพิเศษสำหรับคนที่คุณรักได้','ของขวัญสั่งทำ','/images/lego-cake.png','450.00',16,'Available',1,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (4,'BG-000004','custom-photo-frame','กรอบรูปภาพ','กรอบรูปที่ใส่ภาพของคุณเอง เหมาะสำหรับเก็บความทรงจำดี ๆ ไว้ใกล้ตัว','ของแต่งบ้าน','/images/asset-image6.png','390.00',20,'Available',0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (5,'BG-000005','seasonal-bouquet','ช่อดอกไม้ประดิษฐ์','เลือกโทนสีได้ พร้อมการ์ดเขียนมือฟรี จัดเป็นของขวัญได้ทันที','ดอกไม้','/images/image-other.png','350.00',12,'Available',1,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (6,'BG-000006','bear-bunny-set','Set ตุ๊กตาหมี+กระต่าย','หนึ่งเซตได้ตุ๊กตาสองตัว ของขวัญคู่สำหรับคนพิเศษ','ตุ๊กตา','/images/plush-set.png','1590.00',8,'Available',0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (7,'BG-000007','lego-couple','Lego I Love My GF,BF','ชุดตัวต่อของขวัญคู่รัก จำหน่ายแยกชิ้น สามารถเลือกซื้อเป็นคู่ได้','ของสะสม','/images/asset-image8.png','199.00',30,'Available',0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (8,'BG-000008','monster-sanrio-figure','ฟิกเกอร์ THE MONSTERS × Sanrio','ฟิกเกอร์กล่องสุ่มสำหรับตั้งโชว์ เหมาะกับเพื่อนที่ชอบสะสมของจิ๋ว','ของสะสม','/images/pdf/about-toy.png','590.00',9,'Available',0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (9,'BG-000009','twinkle-crossbody','กระเป๋า Twinkle Twinkle','กระเป๋าสะพายผ้านุ่มสำหรับพกของชิ้นเล็ก สีอบอุ่นเหมาะเป็นของขวัญ','ของสะสม','/images/pdf/about-plush.png','1290.00',4,'Available',0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (10,'BG-000010','shinchan-figure','ฟิกเกอร์ชินจัง','ของสะสมตั้งโต๊ะสำหรับแฟนชินจัง ขนาดกะทัดรัดเหมาะวางข้างจอ','ของสะสม','/images/pdf/shinchan.png','320.00',0,'Out of stock',0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (11,'BG-000011','pastel-tumbler','แก้วเก็บอุณหภูมิพาสเทล','แก้วพร้อมฝาปิดสำหรับเครื่องดื่มระหว่างวัน เหมาะกับโต๊ะทำงาน','ของแต่งบ้าน','/images/pdf/tumbler.png','490.00',18,'Available',0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (12,'BG-000012','aroma-spa-set','ชุดของขวัญสปาอะโรมา','ชุดของขวัญกลิ่นหอมสำหรับวันพักผ่อน เหมาะกับมอบให้ผู้ใหญ่','ของแต่งบ้าน','/images/pdf/spa-set.png','990.00',6,'Available',0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (13,'BG-000013','dried-flower-bouquet','ช่อดอกไม้แห้งโทนอบอุ่น','ช่อดอกไม้แห้งเก็บไว้แต่งห้องได้ เหมาะกับวันรับปริญญาหรือวันครบรอบ','ดอกไม้','/images/pdf/gift-set.png','620.00',8,'Available',0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (14,'BG-000014','coffee-snack-hamper','กระเช้ากาแฟและขนม','ชุดกาแฟและขนมสำหรับเป็นของขวัญขอบคุณในโอกาสพิเศษ','ของแต่งบ้าน','/images/pdf/hamper.png','1190.00',5,'Available',0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (15,'BG-000015','custom-heart-mug','แก้วเซรามิกพิมพ์ชื่อ','แก้วหูจับทรงกลมลายหัวใจ ระบุชื่อหรือคำสั้น ๆ สำหรับพิมพ์บนแก้วได้','ของขวัญสั่งทำ','/images/demo/heart-mug.webp','289.00',22,'Available',0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (16,'BG-000016','custom-flower-tote','กระเป๋าผ้าปักชื่อ','กระเป๋าผ้าแคนวาสลายดอกไม้ เลือกข้อความปักสั้น ๆ สำหรับผู้รับได้','ของขวัญสั่งทำ','/images/demo/flower-tote.webp','359.00',14,'Available',0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (17,'BG-000017','vanilla-candle','เทียนหอมวานิลลา','เทียนหอมในแก้วสีอำพันสำหรับมุมพักผ่อน กลิ่นวานิลลาอ่อน ๆ','ของแต่งบ้าน','/images/demo/vanilla-candle.webp','249.00',24,'Available',0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (18,'BG-000018','mint-desk-clock','นาฬิกาตั้งโต๊ะสีมิ้นต์','นาฬิกาทรงกลมสีมิ้นต์สำหรับโต๊ะทำงานหรือหัวเตียง','ของแต่งบ้าน','/images/demo/mint-clock.webp','549.00',0,'Out of stock',0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (19,'BG-000019','mini-rabbit-figurine','ฟิกเกอร์กระต่ายจิ๋ว','กระต่ายตั้งโต๊ะโทนพาสเทล เหมาะกับสะสมหรือจัดมุมเล็ก ๆ บนชั้นวาง','ของสะสม','/images/demo/rabbit-figurine.webp','169.00',26,'Available',0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (20,'BG-000020','custom-floral-card','การ์ดดอกไม้เขียนข้อความ','การ์ดพับพร้อมซอง ระบุข้อความที่อยากส่งให้คนรับได้','ของขวัญสั่งทำ','/images/demo/floral-card.webp','89.00',40,'Available',0,'2026-11-09 07:53:58','2026-11-09 07:53:58');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (21,'BG-000021','pink-notebook','สมุดบันทึกสีชมพูพร้อมปากกา','สมุดบันทึกปกสีชมพูพร้อมปากกา เหมาะสำหรับจดไอเดียหรือเขียนข้อความถึงคนพิเศษ','ของแต่งบ้าน','/images/demo/pink-notebook.webp','219.00',17,'Available',0,'2026-11-10 00:00:00','2026-11-10 00:00:00');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (22,'BG-000022','handmade-soap-set','ชุดสบู่แฮนด์เมดทรงไอศกรีม','ชุดสบู่แฮนด์เมดทรงไอศกรีมสีฟ้า จัดในกล่องของขวัญ','ของแต่งบ้าน','/images/demo/handmade-soap-set.webp','329.00',12,'Available',0,'2026-11-10 00:00:00','2026-11-10 00:00:00');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (23,'BG-000023','ceramic-vase','แจกันเซรามิกสีขาว','แจกันเซรามิกสีขาวทรงเรียบ เหมาะกับดอกไม้แห้งและมุมโต๊ะขนาดเล็ก','ของแต่งบ้าน','/images/demo/ceramic-vase.webp','399.00',11,'Available',0,'2026-11-10 00:00:00','2026-11-10 00:00:00');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (24,'BG-000024','pastel-bunny-plush','ตุ๊กตากระต่ายผ้านุ่ม','ตุ๊กตากระต่ายผ้านุ่มโทนครีม หูยาว เหมาะเป็นของขวัญน่ารัก ๆ','ตุ๊กตา','/images/demo/pastel-bunny-plush.webp','459.00',13,'Available',0,'2026-11-10 00:00:00','2026-11-10 00:00:00');
INSERT INTO `products` (`product_id`,`sku`,`slug`,`name`,`description`,`category`,`image_url`,`price`,`stock_quantity`,`status`,`is_featured`,`created_at`,`updated_at`) VALUES (25,'BG-000025','soap-flower-bouquet','ช่อดอกไม้สบู่โทนครีม','ช่อดอกไม้สบู่โทนครีมจัดคู่กับดอกไม้แห้ง เหมาะสำหรับมอบเป็นของขวัญหรือวางตกแต่ง','ดอกไม้','/images/demo/soap-flower-bouquet.webp','529.00',7,'Available',0,'2026-11-10 00:00:00','2026-11-10 00:00:00');
CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `schema_migrations` (`name`,`applied_at`) VALUES ('002_shop_workflow.sql','2026-11-09 07:53:57');
INSERT INTO `schema_migrations` (`name`,`applied_at`) VALUES ('003_categories.sql','2026-11-09 07:53:57');
INSERT INTO `schema_migrations` (`name`,`applied_at`) VALUES ('004_admin_profile.sql','2026-11-09 07:53:57');
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_json` json NOT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`session_id`),
  KEY `idx_sessions_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `store_settings` (
  `setting_key` varchar(80) NOT NULL,
  `setting_value` text NOT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS `wishlist_items` (
  `customer_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`,`product_id`),
  KEY `fk_wishlist_product` (`product_id`),
  CONSTRAINT `fk_wishlist_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
SET FOREIGN_KEY_CHECKS=1;
