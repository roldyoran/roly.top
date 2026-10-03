CREATE TABLE `urls` (
	`id` text PRIMARY KEY NOT NULL,
	`original_url` text NOT NULL,
	`short_code` text NOT NULL,
	`created_at` text NOT NULL,
	`visits` integer DEFAULT 0 NOT NULL,
	`creator_ip` text,
	`claim_token` text,
	`expires_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `urls_short_code_unique` ON `urls` (`short_code`);--> statement-breakpoint
CREATE INDEX `urls_short_code_idx` ON `urls` (`short_code`);--> statement-breakpoint
CREATE INDEX `urls_creator_ip_idx` ON `urls` (`creator_ip`);--> statement-breakpoint
CREATE INDEX `urls_claim_token_idx` ON `urls` (`claim_token`);