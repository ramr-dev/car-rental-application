-- ============================================================
--  DriveLux — Database Schema
--  Engine : MySQL 8.0+
--  How to use:
--    1. Open phpMyAdmin
--    2. Click the "SQL" tab at the top
--    3. Paste this entire file and click "Go"
-- ============================================================

-- Create database (skip if it already exists)
CREATE DATABASE IF NOT EXISTS `drivelux`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `drivelux`;

-- ── Users ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `users` (
  `id`          INT            NOT NULL AUTO_INCREMENT,
  `email`       VARCHAR(255)   NOT NULL,
  `password`    VARCHAR(255)   NOT NULL,
  `name`        VARCHAR(255)   NOT NULL,
  `phone`       VARCHAR(50)    NULL,
  `avatar`      VARCHAR(500)   NULL,
  `role`        ENUM('CUSTOMER','ADMIN')                              NOT NULL DEFAULT 'CUSTOMER',
  `kyc_status`  ENUM('NOT_STARTED','PENDING','APPROVED','REJECTED')  NOT NULL DEFAULT 'NOT_STARTED',
  `is_blocked`  TINYINT(1)     NOT NULL DEFAULT 0,
  `created_at`  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Vehicles ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `vehicles` (
  `id`           INT            NOT NULL AUTO_INCREMENT,
  `name`         VARCHAR(255)   NOT NULL,
  `brand`        VARCHAR(100)   NOT NULL,
  `model`        VARCHAR(100)   NOT NULL,
  `year`         INT            NOT NULL,
  `type`         ENUM('SEDAN','SUV','LUXURY','ELECTRIC','CONVERTIBLE','VAN') NOT NULL,
  `fuel`         ENUM('PETROL','DIESEL','ELECTRIC','HYBRID')                 NOT NULL,
  `transmission` ENUM('AUTOMATIC','MANUAL')                                  NOT NULL,
  `seats`        INT            NOT NULL,
  `price_per_day` DECIMAL(10,2) NOT NULL,
  `rating`       FLOAT          NOT NULL DEFAULT 0,
  `review_count` INT            NOT NULL DEFAULT 0,
  `location`     VARCHAR(255)   NOT NULL,
  `image`        VARCHAR(500)   NOT NULL,
  `images`       JSON           NOT NULL,
  `features`     JSON           NOT NULL,
  `available`    TINYINT(1)     NOT NULL DEFAULT 1,
  `description`  TEXT           NOT NULL,
  `mileage`      VARCHAR(50)    NOT NULL,
  `engine`       VARCHAR(100)   NOT NULL,
  `top_speed`    VARCHAR(50)    NOT NULL,
  `acceleration` VARCHAR(50)    NOT NULL,
  `created_at`   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `vehicles_type_idx`        (`type`),
  KEY `vehicles_available_idx`   (`available`),
  KEY `vehicles_price_idx`       (`price_per_day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Bookings ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `bookings` (
  `id`               VARCHAR(20)   NOT NULL,
  `user_id`          INT           NOT NULL,
  `vehicle_id`       INT           NOT NULL,
  `start_date`       DATETIME      NOT NULL,
  `end_date`         DATETIME      NOT NULL,
  `pickup_location`  VARCHAR(255)  NOT NULL,
  `dropoff_location` VARCHAR(255)  NOT NULL,
  `total_price`      DECIMAL(10,2) NOT NULL,
  `status`           ENUM('PENDING','CONFIRMED','ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `customer_name`    VARCHAR(255)  NULL,
  `customer_email`   VARCHAR(255)  NULL,
  `customer_phone`   VARCHAR(50)   NULL,
  `license_number`   VARCHAR(50)   NULL,
  `license_expiry`   DATE          NULL,
  `license_country`  VARCHAR(100)  NULL,
  `notes`            TEXT          NULL,
  `rental_days`      INT           NULL,
  `subtotal`         DECIMAL(10,2) NULL,
  `service_fee`      DECIMAL(10,2) NULL,
  `tax_amount`       DECIMAL(10,2) NULL,
  `deposit_amount`   DECIMAL(10,2) NULL,
  `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `bookings_user_id_idx`    (`user_id`),
  KEY `bookings_vehicle_id_idx` (`vehicle_id`),
  KEY `bookings_status_idx`     (`status`),
  KEY `bookings_created_at_idx` (`created_at`),
  CONSTRAINT `bookings_user_id_fk`
    FOREIGN KEY (`user_id`)    REFERENCES `users` (`id`),
  CONSTRAINT `bookings_vehicle_id_fk`
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── KYC Documents ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `kyc_documents` (
  `id`              INT          NOT NULL AUTO_INCREMENT,
  `user_id`         INT          NOT NULL,
  `document_type`   ENUM('DRIVERS_LICENSE','PASSPORT','NATIONAL_ID') NOT NULL,
  `document_number` VARCHAR(100) NOT NULL,
  `expiry_date`     DATE         NOT NULL,
  `country`         VARCHAR(100) NOT NULL,
  `file_path`       VARCHAR(500) NOT NULL,
  `status`          ENUM('NOT_STARTED','PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `reviewed_by_id`  INT          NULL,
  `review_note`     TEXT         NULL,
  `submitted_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at`     DATETIME     NULL,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `kyc_user_id_idx`  (`user_id`),
  KEY `kyc_status_idx`   (`status`),
  CONSTRAINT `kyc_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Refresh Tokens ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id`         INT         NOT NULL AUTO_INCREMENT,
  `user_id`    INT         NOT NULL,
  `token`      VARCHAR(64) NOT NULL,
  `expires_at` DATETIME    NOT NULL,
  `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `refresh_tokens_token_unique` (`token`),
  KEY `refresh_tokens_user_id_idx` (`user_id`),
  CONSTRAINT `refresh_tokens_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Stripe Payment Fields (added for Stripe Checkout integration) ──────────
-- Run this ALTER TABLE in phpMyAdmin if the bookings table already exists.
-- If running the full schema for the first time, these columns are included
-- in the CREATE TABLE above — but the CREATE TABLE statement needs to be
-- updated manually to include them (or just run the ALTER below).

ALTER TABLE `bookings`
  ADD COLUMN IF NOT EXISTS `stripe_session_id`         VARCHAR(255)  NULL        AFTER `deposit_amount`,
  ADD COLUMN IF NOT EXISTS `stripe_payment_intent_id`  VARCHAR(255)  NULL        AFTER `stripe_session_id`,
  ADD COLUMN IF NOT EXISTS `payment_status`            VARCHAR(20)   NOT NULL DEFAULT 'unpaid' AFTER `stripe_payment_intent_id`,
  ADD COLUMN IF NOT EXISTS `paid_at`                   DATETIME      NULL        AFTER `payment_status`;

-- Add unique index only if it does not already exist
SET @db = DATABASE();
SET @tbl = 'bookings';
SET @idx = 'bookings_stripe_session_id_unique';
SET @sql = IF(
  EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = @db AND table_name = @tbl AND index_name = @idx
  ),
  'SELECT ''Index already exists.''',
  CONCAT('ALTER TABLE `', @tbl, '` ADD UNIQUE KEY `', @idx, '` (`stripe_session_id`)')
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── Reviews ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `reviews` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `rating`      INT          NOT NULL,
  `comment`     TEXT         NULL,
  `user_id`     INT          NOT NULL,
  `vehicle_id`  INT          NOT NULL,
  `booking_id`  VARCHAR(20)  NOT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reviews_booking_id_unique` (`booking_id`),
  KEY `reviews_user_id_idx` (`user_id`),
  KEY `reviews_vehicle_id_idx` (`vehicle_id`),
  CONSTRAINT `reviews_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_vehicle_id_fk`
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_booking_id_fk`
    FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  Done. Verify by running: SHOW TABLES;
-- ============================================================
