CREATE TABLE `clicks` (
	`id` text PRIMARY KEY NOT NULL,
	`url_id` text NOT NULL,
	`country` text,
	`device` text,
	`browser` text,
	`referer` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`url_id`) REFERENCES `urls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `clicks_url_id_idx` ON `clicks` (`url_id`);--> statement-breakpoint
CREATE INDEX `clicks_created_at_idx` ON `clicks` (`created_at`);