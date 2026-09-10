CREATE TABLE `chat_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner` text NOT NULL,
	`request_id` text NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`sources` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chat_owner_request` ON `chat_history` (`owner`,`request_id`);--> statement-breakpoint
CREATE INDEX `chat_owner_id` ON `chat_history` (`owner`,`id`);