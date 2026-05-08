/*
  Warnings:

  - You are about to drop the column `createAt` on the `schedule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `schedule` DROP COLUMN `createAt`;

-- RedefineIndex
CREATE INDEX `Account_userId_fkey` ON `account`(`userId`);
DROP INDEX `account_userId_fkey` ON `account`;

-- RedefineIndex
CREATE INDEX `Favorite_unitId_fkey` ON `favorite`(`unitId`);
DROP INDEX `favorite_unitId_fkey` ON `favorite`;

-- RedefineIndex
CREATE INDEX `LoginLog_userId_fkey` ON `loginlog`(`userId`);
DROP INDEX `loginlog_userId_fkey` ON `loginlog`;

-- RedefineIndex
CREATE INDEX `Session_userId_fkey` ON `session`(`userId`);
DROP INDEX `session_userId_fkey` ON `session`;
