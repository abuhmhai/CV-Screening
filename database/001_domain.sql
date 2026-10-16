-- Generated from the legacy schema; reviewed and run against MySQL 8.4.
CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) NULL,
  `phone` TEXT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(32) NOT NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  UNIQUE KEY `users_email_uq` (`email`),
  UNIQUE KEY `users_username_uq` (`username`),
  PRIMARY KEY (`id`),
  KEY `users_role_idx` (`role`),
  KEY `users_is_verified_idx` (`is_verified`),
  KEY `users_created_at_idx` (`created_at`),
  KEY `users_deleted_at_idx` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `user_follows` (
  `follower_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `followed_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`follower_id`,`followed_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `password_recovery_requests` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `email` VARCHAR(255) NULL,
  `phone` TEXT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `user_profiles` (
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `full_name` TEXT NOT NULL,
  `headline` TEXT NULL,
  `about` TEXT NULL,
  `avatar_url` TEXT NULL,
  `cover_url` TEXT NULL,
  `location` TEXT NULL,
  `social_links` JSON NULL,
  `languages` JSON NULL,
  `public_slug` VARCHAR(255) NULL,
  `profile_completeness` INT NOT NULL DEFAULT 0,
  UNIQUE KEY `user_profiles_public_slug_uq` (`public_slug`),
  PRIMARY KEY (`user_id`),
  KEY `user_profiles_location_idx` (`location`(191)),
  KEY `user_profiles_completeness_idx` (`profile_completeness`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `certifications` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `issuer` TEXT NOT NULL,
  `issue_date` DATETIME(3) NULL,
  `credential_url` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `certifications_user_id_idx` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `title` TEXT NOT NULL,
  `description` TEXT NULL,
  `url` TEXT NULL,
  `skills` JSON NOT NULL DEFAULT ('[]'),
  `start_date` DATETIME(3) NULL,
  `end_date` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `projects_user_id_idx` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `work_experiences` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `company` TEXT NOT NULL,
  `position` TEXT NOT NULL,
  `start_date` DATETIME(3) NOT NULL,
  `end_date` DATETIME(3) NULL,
  `is_current` TINYINT(1) NOT NULL DEFAULT 0,
  `description` TEXT NULL,
  PRIMARY KEY (`id`),
  KEY `work_experiences_user_id_idx` (`user_id`),
  KEY `work_experiences_company_idx` (`company`(191)),
  KEY `work_experiences_start_date_idx` (`start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `educations` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `school` TEXT NOT NULL,
  `degree` TEXT NOT NULL,
  `major` TEXT NULL,
  `gpa` DECIMAL(3,2) NULL,
  `start_year` INT NOT NULL,
  `end_year` INT NULL,
  PRIMARY KEY (`id`),
  KEY `educations_user_id_idx` (`user_id`),
  KEY `educations_school_idx` (`school`(191)),
  KEY `educations_start_year_idx` (`start_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `skills` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` TEXT NULL,
  UNIQUE KEY `skills_name_uq` (`name`),
  PRIMARY KEY (`id`),
  KEY `skills_category_idx` (`category`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `user_skills` (
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `skill_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `level` VARCHAR(32) NOT NULL,
  `years_exp` DECIMAL(4,1) NULL,
  PRIMARY KEY (`user_id`,`skill_id`),
  KEY `user_skills_skill_id_idx` (`skill_id`),
  KEY `user_skills_level_idx` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `skill_endorsements` (
  `endorser_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `skill_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (`endorser_id`,`user_id`,`skill_id`),
  KEY `skill_endorsements_user_skill_idx` (`user_id`,`skill_id`),
  KEY `skill_endorsements_endorser_idx` (`endorser_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `cv_files` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `file_url` TEXT NOT NULL,
  `file_name` TEXT NOT NULL,
  `file_size` BIGINT NOT NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `extracted_text` TEXT NULL,
  PRIMARY KEY (`id`),
  KEY `cv_files_user_id_idx` (`user_id`),
  KEY `cv_files_user_primary_idx` (`user_id`,`is_primary`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `companies` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `logo_url` TEXT NULL,
  `cover_url` TEXT NULL,
  `website` TEXT NULL,
  `industry` TEXT NULL,
  `size_range` TEXT NULL,
  `founded_year` INT NULL,
  `address` TEXT NULL,
  `description` TEXT NULL,
  UNIQUE KEY `companies_slug_uq` (`slug`),
  PRIMARY KEY (`id`),
  KEY `companies_industry_idx` (`industry`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `company_members` (
  `company_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `role` VARCHAR(32) NOT NULL,
  PRIMARY KEY (`company_id`,`user_id`),
  KEY `company_members_user_id_idx` (`user_id`),
  KEY `company_members_company_role_idx` (`company_id`,`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `jobs` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `company_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `created_by` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `title` TEXT NOT NULL,
  `description` TEXT NOT NULL,
  `job_type` TEXT NOT NULL,
  `level` VARCHAR(255) NOT NULL,
  `experience_level` TEXT NULL,
  `category` TEXT NULL,
  `is_remote` TINYINT(1) NOT NULL DEFAULT 0,
  `min_salary` INT NULL,
  `max_salary` INT NULL,
  `salary_currency` VARCHAR(255) NOT NULL DEFAULT 'VND',
  `location` TEXT NULL,
  `required_skills` JSON NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  `slug` VARCHAR(255) NULL,
  `views_count` INT NOT NULL DEFAULT 0,
  `published_at` DATETIME(3) NULL,
  `expires_at` DATETIME(3) NULL,
  UNIQUE KEY `jobs_slug_uq` (`slug`),
  PRIMARY KEY (`id`),
  KEY `jobs_company_id_idx` (`company_id`),
  KEY `jobs_created_by_idx` (`created_by`),
  KEY `jobs_status_idx` (`status`),
  KEY `jobs_expires_at_idx` (`expires_at`),
  KEY `jobs_location_idx` (`location`(191)),
  KEY `jobs_category_idx` (`category`(191)),
  KEY `jobs_experience_level_idx` (`experience_level`(191)),
  KEY `jobs_is_remote_idx` (`is_remote`),
  KEY `jobs_published_at_idx` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `external_jobs` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `source` VARCHAR(255) NOT NULL,
  `title` TEXT NOT NULL,
  `company` TEXT NOT NULL,
  `salary` TEXT NULL,
  `location` TEXT NULL,
  `url` VARCHAR(700) COLLATE utf8mb4_bin NOT NULL,
  `jd` TEXT NULL,
  `skills` JSON NOT NULL DEFAULT ('[]'),
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `crawled_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY `external_jobs_url_uq` (`url`),
  PRIMARY KEY (`id`),
  KEY `external_jobs_source_idx` (`source`),
  KEY `external_jobs_crawled_at_idx` (`crawled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `applications` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `job_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `candidate_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `cv_file_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `cover_letter` TEXT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'APPLIED',
  `applied_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `applications_job_candidate_unique` (`job_id`,`candidate_id`),
  KEY `applications_candidate_id_idx` (`candidate_id`),
  KEY `applications_job_id_idx` (`job_id`),
  KEY `applications_status_idx` (`status`),
  KEY `applications_applied_at_idx` (`applied_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `ai_screening_results` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `application_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `overall_score` DECIMAL(5,2) NOT NULL,
  `skill_score` DECIMAL(5,2) NOT NULL,
  `experience_score` DECIMAL(5,2) NOT NULL,
  `education_score` DECIMAL(5,2) NOT NULL,
  `other_score` DECIMAL(5,2) NOT NULL,
  `grade` VARCHAR(255) NOT NULL,
  `matched_skills` JSON NOT NULL,
  `missing_skills` JSON NOT NULL,
  `strengths` JSON NOT NULL,
  `concerns` JSON NOT NULL,
  `explanation` TEXT NOT NULL,
  `model_version` VARCHAR(255) NOT NULL,
  `processing_time_ms` INT NOT NULL,
  UNIQUE KEY `ai_screening_results_application_id_uq` (`application_id`),
  PRIMARY KEY (`id`),
  KEY `ai_screening_results_overall_score_idx` (`overall_score`),
  KEY `ai_screening_results_grade_idx` (`grade`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `offers` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `application_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `salary_amount` INT NULL,
  `salary_currency` VARCHAR(255) NOT NULL DEFAULT 'VND',
  `start_date` DATETIME(3) NULL,
  `response_deadline` DATETIME(3) NULL,
  `note` TEXT NULL,
  `offer_letter_url` TEXT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  `decline_reason` TEXT NULL,
  `created_by` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `responded_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY `offers_application_id_uq` (`application_id`),
  PRIMARY KEY (`id`),
  KEY `offers_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `application_status_history` (
  `application_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `from_status` VARCHAR(32) NULL,
  `to_status` VARCHAR(32) NOT NULL,
  `changed_by` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `note` TEXT NULL,
  `changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`application_id`,`changed_at`,`to_status`),
  KEY `application_status_history_changed_by_idx` (`changed_by`),
  KEY `application_status_history_application_changed_at_idx` (`application_id`,`changed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `posts` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `author_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `company_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  `content` TEXT NOT NULL,
  `media_urls` JSON NULL,
  `visibility` VARCHAR(32) NOT NULL DEFAULT 'PUBLIC',
  `like_count` INT NOT NULL DEFAULT 0,
  `comment_count` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `posts_author_created_at_idx` (`author_id`,`created_at`),
  KEY `posts_company_created_at_idx` (`company_id`,`created_at`),
  KEY `posts_visibility_idx` (`visibility`),
  KEY `posts_deleted_at_idx` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `comments` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `post_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `parent_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  `author_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `comments_post_created_at_idx` (`post_id`,`created_at`),
  KEY `comments_parent_id_idx` (`parent_id`),
  KEY `comments_author_id_idx` (`author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `reactions` (
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `target_type` VARCHAR(32) NOT NULL,
  `target_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `reaction_type` VARCHAR(32) NOT NULL DEFAULT 'LIKE',
  PRIMARY KEY (`user_id`,`target_type`,`target_id`),
  KEY `reactions_target_idx` (`target_type`,`target_id`),
  KEY `reactions_reaction_type_idx` (`reaction_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `connections` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `requester_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `addressee_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (`id`),
  UNIQUE KEY `connections_requester_addressee_unique` (`requester_id`,`addressee_id`),
  KEY `connections_requester_status_idx` (`requester_id`,`status`),
  KEY `connections_addressee_status_idx` (`addressee_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `conversations` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `type` VARCHAR(32) NOT NULL DEFAULT 'DIRECT',
  PRIMARY KEY (`id`),
  KEY `conversations_type_idx` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `conversation_participants` (
  `conversation_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `last_read_at` DATETIME(3) NULL,
  PRIMARY KEY (`conversation_id`,`user_id`),
  KEY `conversation_participants_user_last_read_idx` (`user_id`,`last_read_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `conversation_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `sender_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `content` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `messages_conversation_sent_at_idx` (`conversation_id`,`sent_at`),
  KEY `messages_sender_sent_at_idx` (`sender_id`,`sent_at`),
  KEY `messages_is_read_idx` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `type` VARCHAR(255) NOT NULL,
  `title` TEXT NOT NULL,
  `body` TEXT NOT NULL,
  `data` JSON NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `notifications_user_read_created_idx` (`user_id`,`is_read`,`created_at`),
  KEY `notifications_type_idx` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `saved_jobs` (
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `job_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`,`job_id`),
  KEY `saved_jobs_user_created_idx` (`user_id`,`created_at`),
  KEY `saved_jobs_job_id_idx` (`job_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `saved_external_jobs` (
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `external_job_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`,`external_job_id`),
  KEY `saved_external_jobs_user_created_idx` (`user_id`,`created_at`),
  KEY `saved_external_jobs_job_id_idx` (`external_job_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `job_alerts` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `keyword` TEXT NULL,
  `filters` JSON NULL,
  `frequency` VARCHAR(32) NOT NULL DEFAULT 'DAILY',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_sent_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `job_alerts_user_id_idx` (`user_id`),
  KEY `job_alerts_active_frequency_idx` (`is_active`,`frequency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `company_followers` (
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `company_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`,`company_id`),
  KEY `company_followers_company_id_idx` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `generated_cvs` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `title` TEXT NOT NULL,
  `template_id` VARCHAR(255) NOT NULL DEFAULT 'classic',
  `data` JSON NOT NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `generated_cv_user_primary_idx` (`user_id`,`is_primary`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `moderation_reports` (
  `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `reporter_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `target_type` VARCHAR(255) NOT NULL,
  `target_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `reason` TEXT NOT NULL,
  `details` TEXT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `moderation_reports_status_created_idx` (`status`,`created_at`),
  KEY `moderation_reports_target_idx` (`target_type`,`target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `privacy_settings` (
  `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `profile_visibility` VARCHAR(255) NOT NULL DEFAULT 'PUBLIC',
  `show_activity` TINYINT(1) NOT NULL DEFAULT 1,
  `show_connections` TINYINT(1) NOT NULL DEFAULT 1,
  `allow_messages` VARCHAR(255) NOT NULL DEFAULT 'EVERYONE',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `user_follows` ADD CONSTRAINT `user_follows_follower_id_fk` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_follows` ADD CONSTRAINT `user_follows_followed_id_fk` FOREIGN KEY (`followed_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `certifications` ADD CONSTRAINT `certifications_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `projects` ADD CONSTRAINT `projects_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `work_experiences` ADD CONSTRAINT `work_experiences_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `educations` ADD CONSTRAINT `educations_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_skills` ADD CONSTRAINT `user_skills_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_skills` ADD CONSTRAINT `user_skills_skill_id_fk` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE;

ALTER TABLE `skill_endorsements` ADD CONSTRAINT `skill_endorsements_endorser_id_fk` FOREIGN KEY (`endorser_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `skill_endorsements` ADD CONSTRAINT `skill_endorsements_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `skill_endorsements` ADD CONSTRAINT `skill_endorsements_skill_id_fk` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE;

ALTER TABLE `cv_files` ADD CONSTRAINT `cv_files_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `company_members` ADD CONSTRAINT `company_members_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

ALTER TABLE `company_members` ADD CONSTRAINT `company_members_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `jobs` ADD CONSTRAINT `jobs_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

ALTER TABLE `jobs` ADD CONSTRAINT `jobs_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT;

ALTER TABLE `applications` ADD CONSTRAINT `applications_job_id_fk` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE;

ALTER TABLE `applications` ADD CONSTRAINT `applications_candidate_id_fk` FOREIGN KEY (`candidate_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `applications` ADD CONSTRAINT `applications_cv_file_id_fk` FOREIGN KEY (`cv_file_id`) REFERENCES `cv_files` (`id`) ON DELETE RESTRICT;

ALTER TABLE `ai_screening_results` ADD CONSTRAINT `ai_screening_results_application_id_fk` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE;

ALTER TABLE `offers` ADD CONSTRAINT `offers_application_id_fk` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE;

ALTER TABLE `application_status_history` ADD CONSTRAINT `application_status_history_application_id_fk` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE;

ALTER TABLE `application_status_history` ADD CONSTRAINT `application_status_history_changed_by_fk` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT;

ALTER TABLE `posts` ADD CONSTRAINT `posts_author_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `posts` ADD CONSTRAINT `posts_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

ALTER TABLE `comments` ADD CONSTRAINT `comments_post_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE;

ALTER TABLE `comments` ADD CONSTRAINT `comments_parent_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE;

ALTER TABLE `comments` ADD CONSTRAINT `comments_author_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `reactions` ADD CONSTRAINT `reactions_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `connections` ADD CONSTRAINT `connections_requester_id_fk` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `connections` ADD CONSTRAINT `connections_addressee_id_fk` FOREIGN KEY (`addressee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `conversation_participants` ADD CONSTRAINT `conversation_participants_conversation_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE;

ALTER TABLE `conversation_participants` ADD CONSTRAINT `conversation_participants_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE;

ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `saved_jobs` ADD CONSTRAINT `saved_jobs_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `saved_jobs` ADD CONSTRAINT `saved_jobs_job_id_fk` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE;

ALTER TABLE `saved_external_jobs` ADD CONSTRAINT `saved_external_jobs_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `saved_external_jobs` ADD CONSTRAINT `saved_external_jobs_external_job_id_fk` FOREIGN KEY (`external_job_id`) REFERENCES `external_jobs` (`id`) ON DELETE CASCADE;

ALTER TABLE `job_alerts` ADD CONSTRAINT `job_alerts_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `company_followers` ADD CONSTRAINT `company_followers_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `company_followers` ADD CONSTRAINT `company_followers_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

ALTER TABLE `generated_cvs` ADD CONSTRAINT `generated_cvs_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `moderation_reports` ADD CONSTRAINT `moderation_reports_reporter_id_fk` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `privacy_settings` ADD CONSTRAINT `privacy_settings_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
