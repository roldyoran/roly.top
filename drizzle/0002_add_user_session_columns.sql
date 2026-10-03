-- Eliminar índice obsoleto
DROP INDEX IF EXISTS `urls_creator_ip_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `urls_claim_token_idx`;--> statement-breakpoint

-- Eliminar columna obsoleta
ALTER TABLE `urls` DROP COLUMN `creator_ip`;--> statement-breakpoint

-- Agregar nuevas columnas
ALTER TABLE `urls` ADD `user_id` text;--> statement-breakpoint
ALTER TABLE `urls` ADD `session_id` text;--> statement-breakpoint
ALTER TABLE `urls` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `urls` ADD `title` text;--> statement-breakpoint

-- Crear nuevos índices
CREATE INDEX `urls_user_id_idx` ON `urls` (`user_id`);--> statement-breakpoint
CREATE INDEX `urls_session_id_idx` ON `urls` (`session_id`);
