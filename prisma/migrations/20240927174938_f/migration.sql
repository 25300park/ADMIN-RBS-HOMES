/*
  Warnings:

  - You are about to drop the column `priceRent` on the `Unit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Unit` DROP COLUMN `priceRent`,
    ADD COLUMN `fullAdress` VARCHAR(250) NULL,
    ADD COLUMN `ownerEmail` VARCHAR(50) NULL;
