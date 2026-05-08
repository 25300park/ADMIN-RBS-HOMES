/*
  Warnings:

  - You are about to alter the column `images` on the `Unit` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.

*/
-- AlterTable
ALTER TABLE `Unit` ADD COLUMN `viewCount` INTEGER NOT NULL DEFAULT 0,
    MODIFY `images` JSON NULL;

-- CreateTable
CREATE TABLE `SiteVisitorLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` VARCHAR(255) NOT NULL,
    `userId` INTEGER NULL,
    `ip` VARCHAR(100) NOT NULL,
    `userAgent` VARCHAR(500) NOT NULL,
    `visitStart` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `visitEnd` DATETIME(3) NULL,
    `lastActive` DATETIME(3) NULL,
    `isLoggedIn` BOOLEAN NOT NULL DEFAULT false,

    INDEX `SiteVisitorLog_userId_idx`(`userId`),
    INDEX `SiteVisitorLog_visitStart_idx`(`visitStart`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PasswordResetLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(300) NOT NULL,
    `prevPassword` VARCHAR(255) NULL,
    `newPassword` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip` VARCHAR(100) NULL,

    INDEX `PasswordResetLog_createdAt_idx`(`createdAt`),
    INDEX `PasswordResetLog_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UnitViewLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unitId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `ip` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UnitViewLog_createdAt_idx`(`createdAt`),
    INDEX `UnitViewLog_unitId_idx`(`unitId`),
    INDEX `UnitViewLog_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UnitViewLog` ADD CONSTRAINT `UnitViewLog_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UnitViewLog` ADD CONSTRAINT `UnitViewLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
