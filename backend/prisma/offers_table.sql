-- Apply this SQL in phpMyAdmin, then run `npx prisma generate` in the backend/ directory.

CREATE TABLE `offers` (
  `id`               INT            NOT NULL AUTO_INCREMENT,
  `title`            VARCHAR(120)   NOT NULL,
  `description`      VARCHAR(500)   NOT NULL DEFAULT '',
  `discount_percent` DECIMAL(5,2)   NOT NULL,
  `min_days`         INT            NOT NULL DEFAULT 1,
  `max_days`         INT            NULL,
  `is_active`        TINYINT(1)     NOT NULL DEFAULT 1,
  `badge_color`      VARCHAR(50)    NOT NULL DEFAULT 'primary',
  `created_at`       DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default offers that mirror the previous hardcoded dynamic-pricing tiers.
-- Adjust or add rows as needed from the admin Offers page.
INSERT INTO `offers` (`title`, `description`, `discount_percent`, `min_days`, `max_days`, `is_active`, `badge_color`) VALUES
('Weekly Deal',   'Book 7 or more days and save 20% on your rental.',  20.00, 7, NULL, 1, 'primary'),
('3-Day Special', 'Book 3–6 days and enjoy a 10% discount.',            10.00, 3,    6, 1, 'success');
