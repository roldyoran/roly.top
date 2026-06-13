-- Complete schema migration for shorturl
-- Based on src/db/schema.ts + src/db/auth-schema.ts

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS `accounts`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `verifications`;
DROP TABLE IF EXISTS `urls`;
DROP TABLE IF EXISTS `users`;

-- Table: users (Better Auth)
CREATE TABLE `users` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `email_verified` integer DEFAULT false NOT NULL,
  `image` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  `role` text DEFAULT 'user',
  `banned` integer DEFAULT false,
  `ban_reason` text,
  `ban_expires` integer,
  `url_limit` integer DEFAULT 2
);
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);

-- Table: sessions (Better Auth)
CREATE TABLE `sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `expires_at` integer NOT NULL,
  `token` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  `ip_address` text,
  `user_agent` text,
  `user_id` text NOT NULL,
  `impersonated_by` text,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);
CREATE INDEX `sessions_userId_idx` ON `sessions` (`user_id`);

-- Table: accounts (Better Auth)
CREATE TABLE `accounts` (
  `id` text PRIMARY KEY NOT NULL,
  `account_id` text NOT NULL,
  `provider_id` text NOT NULL,
  `user_id` text NOT NULL,
  `access_token` text,
  `refresh_token` text,
  `id_token` text,
  `access_token_expires_at` integer,
  `refresh_token_expires_at` integer,
  `scope` text,
  `password` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `accounts_userId_idx` ON `accounts` (`user_id`);

-- Table: verifications (Better Auth)
CREATE TABLE `verifications` (
  `id` text PRIMARY KEY NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);

-- Table: urls (shorturl)
CREATE TABLE `urls` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `original_url` text NOT NULL,
  `short_code` text NOT NULL,
  `created_at` text NOT NULL,
  `visits` integer DEFAULT 0 NOT NULL,
  `user_id` text
);
CREATE UNIQUE INDEX `urls_short_code_unique` ON `urls` (`short_code`);
CREATE INDEX `user_id_idx` ON `urls` (`user_id`);
