-- DropIndex
DROP INDEX `ix_schedule_unit_id` ON `Schedule`;

-- AlterTable
ALTER TABLE `Schedule` ADD COLUMN `desc` VARCHAR(255) NULL,
    ADD COLUMN `endedAt` DATETIME(3) NULL,
    ADD COLUMN `location` VARCHAR(255) NULL,
    ADD COLUMN `startedAt` DATETIME(3) NULL,
    ADD COLUMN `title` VARCHAR(100) NULL,
    MODIFY `email` VARCHAR(300) NULL,
    MODIFY `message` VARCHAR(255) NULL,
    MODIFY `mobile` VARCHAR(50) NULL,
    MODIFY `username` VARCHAR(50) NULL;
