-- Visibilidad en el catálogo público (opt-in por enlace, default privado)
ALTER TABLE `urls` ADD `is_public` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `urls_is_public_idx` ON `urls` (`is_public`);
