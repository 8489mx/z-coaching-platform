-- ==============================================================================
-- Z COACHING PLATFORM - HOSTINGER MYSQL PRODUCTION SCHEMA (V2026.PROD)
-- Character Set: utf8mb4 / utf8mb4_unicode_ci
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `clients`;
CREATE TABLE `clients` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NOT NULL UNIQUE,
  `gender` ENUM('MALE', 'FEMALE') NOT NULL DEFAULT 'MALE',
  `age` INT NOT NULL,
  `height_cm` DECIMAL(5,2) NOT NULL,
  `starting_weight_kg` DECIMAL(5,2) NOT NULL,
  `current_weight_kg` DECIMAL(5,2) NOT NULL,
  `target_weight_kg` DECIMAL(5,2) DEFAULT NULL,
  `activity_level` ENUM('SEDENTARY', 'LIGHT', 'MODERATE', 'HEAVY') NOT NULL DEFAULT 'SEDENTARY',
  `goal` ENUM('FAT_LOSS', 'AGGRESSIVE_CUT', 'MAINTENANCE', 'LEAN_BULK') NOT NULL DEFAULT 'FAT_LOSS',
  `target_calories` INT NOT NULL DEFAULT 1800,
  `target_protein_g` INT NOT NULL DEFAULT 150,
  `target_carbs_g` INT NOT NULL DEFAULT 180,
  `target_fats_g` INT NOT NULL DEFAULT 55,
  `target_water_l` DECIMAL(3,1) NOT NULL DEFAULT 3.0,
  `target_steps` INT NOT NULL DEFAULT 8000,
  `training_split` VARCHAR(100) DEFAULT 'تقسيم علوي / سفلي (Upper / Lower 4x)',
  `training_days_per_week` INT NOT NULL DEFAULT 4,
  `environment` ENUM('GYM', 'HOME_DUMBBELLS', 'CALISTHENICS') NOT NULL DEFAULT 'GYM',
  `medical_flags_json` JSON DEFAULT NULL,
  `subscription_start_date` DATE NOT NULL,
  `subscription_duration_days` INT NOT NULL DEFAULT 30,
  `is_frozen` BOOLEAN NOT NULL DEFAULT FALSE,
  `subscription_status` ENUM('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'FROZEN') NOT NULL DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `weekly_checkins`;
CREATE TABLE `weekly_checkins` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `client_id` VARCHAR(36) NOT NULL,
  `checkin_date` DATE NOT NULL,
  `weight_kg` DECIMAL(5,2) NOT NULL,
  `waist_cm` DECIMAL(5,2) NOT NULL,
  `adherence_pct` INT NOT NULL DEFAULT 100,
  `hunger_fatigue_score` INT NOT NULL DEFAULT 5,
  `notes` TEXT DEFAULT NULL,
  `engine_decision` VARCHAR(50) NOT NULL,
  `calorie_adjustment` INT NOT NULL DEFAULT 0,
  `new_calories` INT NOT NULL,
  `is_approved_by_coach` BOOLEAN NOT NULL DEFAULT FALSE,
  `coach_feedback_message` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `freeze_logs`;
CREATE TABLE `freeze_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `client_id` VARCHAR(36) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE DEFAULT NULL,
  `days_count` INT NOT NULL DEFAULT 0,
  `reason` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `daily_habit_logs`;
CREATE TABLE `daily_habit_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `client_id` VARCHAR(36) NOT NULL,
  `log_date` DATE NOT NULL,
  `step_count` INT NOT NULL DEFAULT 0,
  `sleep_hours` DECIMAL(3,1) NOT NULL DEFAULT 7.0,
  `sleep_quality_score` INT NOT NULL DEFAULT 7,
  `water_liters` DECIMAL(3,1) NOT NULL DEFAULT 0.0,
  `workout_completed` BOOLEAN NOT NULL DEFAULT FALSE,
  `meals_logged_count` INT NOT NULL DEFAULT 0,
  `daily_score` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `client_daily_log_idx` (`client_id`, `log_date`),
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `exercise_logs`;
CREATE TABLE `exercise_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `client_id` VARCHAR(36) NOT NULL,
  `exercise_id` VARCHAR(100) NOT NULL,
  `session_date` DATE NOT NULL,
  `set_number` INT NOT NULL,
  `weight_kg` DECIMAL(6,2) NOT NULL,
  `reps` INT NOT NULL,
  `rir` INT DEFAULT 2,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
