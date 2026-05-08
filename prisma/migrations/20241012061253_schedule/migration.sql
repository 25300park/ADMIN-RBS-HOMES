/*
  Warnings:

  - You are about to drop the column `title` on the `Schedule` table. All the data in the column will be lost.
  - Added the required column `email` to the `Schedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `Schedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mobile` to the `Schedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `Schedule` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Schedule` DROP FOREIGN KEY `Schedule_unitId_fkey`;

-- DropIndex
DROP INDEX `ix_user_user_id` ON `User`;

-- AlterTable
ALTER TABLE `Schedule` DROP COLUMN `title`,
    ADD COLUMN `date` DATETIME(3) NULL,
    ADD COLUMN `email` VARCHAR(300) NOT NULL,
    ADD COLUMN `lastUpdate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `message` VARCHAR(255) NOT NULL,
    ADD COLUMN `mobile` VARCHAR(50) NOT NULL,
    ADD COLUMN `regId` INTEGER NULL,
    ADD COLUMN `requestDate` DATETIME(3) NULL,
    ADD COLUMN `userId` INTEGER NULL,
    ADD COLUMN `username` VARCHAR(50) NOT NULL,
    MODIFY `status` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `ix_user_user_id` ON `User`(`id`);
