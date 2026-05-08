/*
  Warnings:

  - You are about to alter the column `amenity` on the `Unit` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Json`.

*/
-- AlterTable
ALTER TABLE `Unit` MODIFY `amenity` JSON NULL;
