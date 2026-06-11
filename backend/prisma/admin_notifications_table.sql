-- Apply this SQL in phpMyAdmin, then run `npx prisma generate` in the backend/ directory.

CREATE TABLE `admin_notifications` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `type`        VARCHAR(50)   NOT NULL DEFAULT 'booking_paid',
  `title`       VARCHAR(255)  NOT NULL,
  `body`        TEXT          NOT NULL,
  `booking_id`  VARCHAR(30)   NULL,
  `is_read`     TINYINT(1)    NOT NULL DEFAULT 0,
  `created_at`  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_admin_notif_is_read`   (`is_read`),
  INDEX `idx_admin_notif_created`   (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
