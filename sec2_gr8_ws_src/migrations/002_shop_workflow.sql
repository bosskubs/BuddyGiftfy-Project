CREATE TABLE IF NOT EXISTS store_settings (
  setting_key VARCHAR(80) NOT NULL PRIMARY KEY,
  setting_value TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS wishlist_items (
  customer_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id, product_id),
  CONSTRAINT fk_wishlist_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE orders ADD COLUMN shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100) NULL;
ALTER TABLE orders ADD COLUMN shipping_carrier VARCHAR(80) NULL;
ALTER TABLE orders ADD COLUMN checkout_key VARCHAR(64) NULL;
ALTER TABLE orders ADD UNIQUE KEY uq_orders_checkout (checkout_key);
ALTER TABLE order_items ADD COLUMN custom_note VARCHAR(500) NULL;
ALTER TABLE payments ADD COLUMN proof_path VARCHAR(100) NULL;
ALTER TABLE payments ADD COLUMN submitted_at DATETIME NULL;
ALTER TABLE payments ADD COLUMN review_note VARCHAR(500) NULL;
