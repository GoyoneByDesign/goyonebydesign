CREATE TABLE `max_drafts` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`content` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `max_drafts_owner_id` ON `max_drafts` (`owner`,`id`);--> statement-breakpoint
CREATE TABLE `max_settings` (
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`value` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `max_settings_owner_name` ON `max_settings` (`owner`,`name`);