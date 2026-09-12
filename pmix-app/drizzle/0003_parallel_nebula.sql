CREATE TABLE `report_formats` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`data` text NOT NULL,
	`revision` integer NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `report_formats_owner_id` ON `report_formats` (`owner`,`id`);