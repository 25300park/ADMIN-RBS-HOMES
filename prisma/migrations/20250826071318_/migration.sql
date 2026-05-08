/*
  Warnings:

  - You are about to alter the column `images` on the `unit` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.

*/
-- DropForeignKey
ALTER TABLE `account` DROP FOREIGN KEY `Account_userId_fkey`;

-- DropForeignKey
ALTER TABLE `favorite` DROP FOREIGN KEY `Favorite_unitId_fkey`;

-- DropForeignKey
ALTER TABLE `favorite` DROP FOREIGN KEY `Favorite_userId_fkey`;

-- DropForeignKey
ALTER TABLE `loginlog` DROP FOREIGN KEY `LoginLog_userId_fkey`;

-- DropForeignKey
ALTER TABLE `session` DROP FOREIGN KEY `Session_userId_fkey`;

-- DropForeignKey
ALTER TABLE `unit` DROP FOREIGN KEY `Unit_adminId_fkey`;

-- DropIndex
DROP INDEX `ix_notice_state` ON `notice`;

-- DropIndex
DROP INDEX `ix_user_user_id` ON `user`;

-- AlterTable
ALTER TABLE `schedule` ADD COLUMN `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `unit` ADD COLUMN `viewCount` INTEGER NOT NULL DEFAULT 0,
    MODIFY `images` JSON NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `canPreSale` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `memo` TEXT NULL;

-- CreateTable
CREATE TABLE `featuredunit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unitId` INTEGER NOT NULL,
    `order` INTEGER NOT NULL,
    `label` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `backgroundColor` VARCHAR(191) NULL,
    `textColor` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FeaturedUnit_unitId_key`(`unitId`),
    INDEX `FeaturedUnit_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passwordresetlog` (
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
CREATE TABLE `unitviewlog` (
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

-- CreateTable
CREATE TABLE `sitevisitorlog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` VARCHAR(100) NOT NULL,
    `userId` INTEGER NULL,
    `ip` VARCHAR(100) NOT NULL,
    `userAgent` TEXT NULL,
    `visitStart` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `visitEnd` DATETIME(3) NULL,
    `lastActive` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isLoggedIn` BOOLEAN NOT NULL DEFAULT false,
    `path` VARCHAR(255) NULL,

    INDEX `SiteVisitorLog_ip_idx`(`ip`),
    INDEX `SiteVisitorLog_sessionId_idx`(`sessionId`),
    INDEX `SiteVisitorLog_userId_fkey`(`userId`),
    INDEX `SiteVisitorLog_visitStart_idx`(`visitStart`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `areabanner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `matchType` VARCHAR(191) NOT NULL,
    `matchValue` VARCHAR(191) NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 10,
    `title` VARCHAR(200) NULL,
    `description` TEXT NULL,
    `images` LONGTEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `fullAddress` VARCHAR(500) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,

    INDEX `AreaBanner_matchType_matchValue_idx`(`matchType`, `matchValue`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(300) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `message` TEXT NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `adminId` INTEGER NULL,
    `response` TEXT NULL,
    `responseType` INTEGER NULL,
    `respondedAt` DATETIME(3) NULL,
    `memo` VARCHAR(191) NULL,
    `ip` VARCHAR(100) NULL,
    `userId` INTEGER NULL,

    INDEX `Contact_adminId_fkey`(`adminId`),
    INDEX `Contact_userId_fkey`(`userId`),
    INDEX `Contact_status_idx`(`status`),
    INDEX `Contact_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complainunit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unitId` INTEGER NOT NULL,
    `writerId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `message` TEXT NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `adminId` INTEGER NULL,
    `response` TEXT NULL,
    `responseType` INTEGER NULL,
    `respondedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `popups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdByUserId` INTEGER NOT NULL,
    `useOverlay` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `priority` INTEGER NOT NULL DEFAULT 10,
    `targetAudience` VARCHAR(191) NULL DEFAULT 'all',
    `targetConditions` JSON NULL,
    `buttonText` VARCHAR(100) NULL,
    `buttonAction` VARCHAR(255) NULL,
    `images` TEXT NULL,
    `popupType` INTEGER NOT NULL DEFAULT 0,
    `triggerType` INTEGER NOT NULL DEFAULT 0,
    `triggerValue` VARCHAR(191) NULL,
    `showFrequency` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unit` ADD CONSTRAINT `unit_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorite` ADD CONSTRAINT `favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorite` ADD CONSTRAINT `favorite_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loginlog` ADD CONSTRAINT `loginlog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unitviewlog` ADD CONSTRAINT `unitviewlog_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unitviewlog` ADD CONSTRAINT `unitviewlog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sitevisitorlog` ADD CONSTRAINT `sitevisitorlog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact` ADD CONSTRAINT `contact_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact` ADD CONSTRAINT `contact_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complainunit` ADD CONSTRAINT `complainunit_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complainunit` ADD CONSTRAINT `complainunit_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RedefineIndex
CREATE INDEX `Unit_adminId_fkey` ON `unit`(`adminId`);
DROP INDEX `ix_unit_admin_id` ON `unit`;
