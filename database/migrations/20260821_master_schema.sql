-- ============================================================================
-- Z Coaching & Karim Zakaria Platform — Master Database Schema V2.0
-- Dialect: MySQL / MariaDB (InnoDB, utf8mb4_unicode_ci)
-- Unified Table Architecture: Single 'users' Table (No Separated 'clients' Table)
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. جدول المستخدمين والمشتركين الموحد (users) — الهوية والحساب والملف الرياضي
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `client_code` VARCHAR(50) NOT NULL,
  `phone_number` VARCHAR(25) NOT NULL,
  `email` VARCHAR(120) NULL,
  `password` VARCHAR(255) NULL,
  `token_version` INT UNSIGNED NOT NULL DEFAULT 1,
  `full_name` VARCHAR(100) NULL,
  `role` ENUM('ADMIN', 'CLIENT') NOT NULL DEFAULT 'CLIENT',
  `package_tier` ENUM('ELITE', 'MAX') NOT NULL DEFAULT 'ELITE',
  `duration_months` INT UNSIGNED NOT NULL DEFAULT 4,
  `subscription_package` VARCHAR(50) DEFAULT 'ELITE_3_PLUS_1',
  `subscription_price` DECIMAL(10, 2) NOT NULL DEFAULT 2500.00,
  `payment_status` ENUM('PENDING', 'PAID', 'UNPAID') NOT NULL DEFAULT 'PAID',
  `payment_method` ENUM('INSTAPAY', 'VODAFONE_CASH', 'CARD', 'BANK_TRANSFER') NOT NULL DEFAULT 'INSTAPAY',
  `plan_approval_status` VARCHAR(50) DEFAULT 'PENDING_COACH_REVIEW',
  `subscription_status` ENUM('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'PAUSED') NOT NULL DEFAULT 'ACTIVE',
  `subscription_start_date` DATE NULL,
  `subscription_end_date` DATE NULL,
  `avatar` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `enable_rest_timer` TINYINT(1) NOT NULL DEFAULT 0,
  `enable_weight_logging` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_code` (`client_code`),
  UNIQUE KEY `idx_users_phone` (`phone_number`),
  INDEX `idx_users_status` (`subscription_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. جدول طلبات الموقع الخارجي (orders) — بوابة الشراء والتأكيد
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(30) NOT NULL, -- مثال: #KZ-4819
  `client_id` INT UNSIGNED NULL,
  `customer_name` VARCHAR(100) NOT NULL,
  `phone_number` VARCHAR(25) NOT NULL,
  `package_tier` ENUM('ELITE', 'MAX') NOT NULL,
  `duration_months` INT UNSIGNED NOT NULL DEFAULT 4,
  `payment_method` ENUM('INSTAPAY', 'VODAFONE_CASH', 'CARD', 'BANK_TRANSFER') NOT NULL,
  `amount_paid` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(5) NOT NULL DEFAULT 'EGP',
  `payment_status` ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  `transaction_reference` VARCHAR(100) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_orders_phone` (`phone_number`),
  INDEX `idx_orders_status` (`payment_status`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. جدول استمارة الدخول الصحية والبدنية (intake_submissions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `intake_submissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `answers` JSON NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING_COACH_REVIEW',
  `progress_percent` INT UNSIGNED NOT NULL DEFAULT 100,
  `coach_notes` TEXT NULL,
  `reviewed_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_intake_user` (`user_id`),
  CONSTRAINT `fk_intake_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. جدول خطط وبرامج التدريب والتغذية الشاملة (programs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `programs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `program_data` JSON NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- DRAFT | ACTIVE | ARCHIVED
  `version` INT UNSIGNED NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_programs_user` (`user_id`),
  CONSTRAINT `fk_programs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. جدول صور القوام المشفرة (client_photos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `client_photos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `photo_type` ENUM('FRONT', 'SIDE', 'BACK') NOT NULL,
  `photo_url` TEXT NOT NULL,
  `checkin_stage` VARCHAR(50) NOT NULL DEFAULT 'INTAKE',
  `taken_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_photos_user` (`user_id`),
  CONSTRAINT `fk_photos_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. جدول خطة التغذية والوجبات الممتدة (nutrition_plans)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `nutrition_plans` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `target_calories` INT UNSIGNED NOT NULL,
  `protein_grams` INT UNSIGNED NOT NULL,
  `carbs_grams` INT UNSIGNED NOT NULL,
  `fats_grams` INT UNSIGNED NOT NULL,
  `meals_data` JSON NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_nutrition_user` (`user_id`),
  INDEX `idx_nutrition_active` (`is_active`),
  CONSTRAINT `fk_nutrition_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. جدول خطة التدريب والكارديو والإحماء (workout_plans)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `workout_plans` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `split_name` VARCHAR(60) NOT NULL,
  `days_per_week` INT UNSIGNED NOT NULL DEFAULT 4,
  `schedule_data` JSON NOT NULL,
  `cardio_protocol` JSON NULL,
  `warmup_mobility` JSON NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_workout_user` (`user_id`),
  INDEX `idx_workout_active` (`is_active`),
  CONSTRAINT `fk_workout_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. جدول المتابعات الأسبوعية والتنظيم التلقائي (weekly_checkins)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `weekly_checkins` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `week_number` INT UNSIGNED NOT NULL,
  `current_weight` DECIMAL(5, 2) NOT NULL,
  `current_waist` DECIMAL(5, 2) NULL,
  `adherence_score` INT UNSIGNED NOT NULL DEFAULT 100,
  `biofeedback` JSON NULL,
  `coach_notes` TEXT NULL,
  `auto_adjustment` JSON NULL,
  `is_approved` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_checkins_user` (`user_id`),
  INDEX `idx_checkins_week` (`user_id`, `week_number`),
  CONSTRAINT `fk_checkins_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. جدول أمان النظام ومكافحة التخمين (rate_limit_logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rate_limit_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip_address` VARCHAR(45) NOT NULL,
  `attempted_code` VARCHAR(30) NULL,
  `attempt_count` INT UNSIGNED NOT NULL DEFAULT 1,
  `is_blocked` TINYINT(1) NOT NULL DEFAULT 0,
  `last_attempt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_rate_limit_ip` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
