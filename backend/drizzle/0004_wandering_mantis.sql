ALTER TABLE `urls` ADD `claim_token` text;--> statement-breakpoint
ALTER TABLE `urls` ADD `expires_at` text;--> statement-breakpoint
CREATE INDEX `claim_token_idx` ON `urls` (`claim_token`);