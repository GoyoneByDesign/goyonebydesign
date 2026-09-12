CREATE TABLE `report_files` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`title` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`kind` text NOT NULL,
	`sources` text NOT NULL,
	`sha256` text NOT NULL,
	`created` text NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	`drive_id` text,
	`drive_synced` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `report_files_owner_id` ON `report_files` (`owner`,`id`);--> statement-breakpoint
CREATE INDEX `report_files_owner_deleted_created` ON `report_files` (`owner`,`deleted`,`created`);