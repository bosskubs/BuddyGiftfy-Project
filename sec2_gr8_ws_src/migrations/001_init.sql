CREATE DATABASE IF NOT EXISTS buddygiftfy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE buddygiftfy;

CREATE TABLE IF NOT EXISTS customers (
  customer_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  phone VARCHAR(30) NULL,
  address TEXT NULL,
  status ENUM('Active','Inactive','Suspended') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customers_status (status),
  INDEX idx_customers_name (last_name, first_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_accounts (
  admin_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  role ENUM('Owner','Manager','Editor') NOT NULL DEFAULT 'Editor',
  status ENUM('Active','Inactive','Suspended') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  product_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(32) NOT NULL UNIQUE,
  slug VARCHAR(180) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  image_url VARCHAR(500) NOT NULL DEFAULT '/images/product-placeholder.svg',
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('Available','Out of stock','Inactive') NOT NULL DEFAULT 'Available',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_status_category (status, category),
  INDEX idx_products_featured (is_featured, status),
  FULLTEXT INDEX ft_products_search (name, description, category),
  CONSTRAINT chk_products_price CHECK (price >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  order_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) NOT NULL UNIQUE,
  customer_id BIGINT UNSIGNED NOT NULL,
  status ENUM('Pending','Confirmed','Preparing','Shipped','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
  subtotal DECIMAL(10,2) NOT NULL,
  gift_wrap_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  gift_wrap BOOLEAN NOT NULL DEFAULT FALSE,
  gift_message VARCHAR(500) NULL,
  shipping_name VARCHAR(160) NOT NULL,
  shipping_phone VARCHAR(30) NOT NULL,
  shipping_address TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT,
  INDEX idx_orders_status_date (status, created_at),
  INDEX idx_orders_customer (customer_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  product_name VARCHAR(180) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
  UNIQUE KEY uq_order_product (order_id, product_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  payment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  provider_name VARCHAR(80) NOT NULL DEFAULT 'Manual bank transfer',
  payment_status ENUM('Pending','Completed','Failed','Refunded') NOT NULL DEFAULT 'Pending',
  deadline DATETIME NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  INDEX idx_payments_status (payment_status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_logs (
  log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  admin_id BIGINT UNSIGNED NULL,
  customer_id BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  description TEXT NULL,
  ip_address VARCHAR(45) NULL,
  status ENUM('Success','Failed','Pending') NOT NULL DEFAULT 'Success',
  device VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_admin FOREIGN KEY (admin_id) REFERENCES admin_accounts(admin_id) ON DELETE SET NULL,
  CONSTRAINT fk_logs_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL,
  INDEX idx_logs_created (created_at),
  INDEX idx_logs_admin (admin_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(64) NOT NULL PRIMARY KEY,
  data_json JSON NOT NULL,
  expires_at DATETIME NOT NULL,
  INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contact_messages (
  message_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('New','Read','Resolved') NOT NULL DEFAULT 'New',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_messages_status_date (status, created_at)
) ENGINE=InnoDB;
