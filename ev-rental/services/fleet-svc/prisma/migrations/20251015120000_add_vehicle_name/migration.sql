-- Add missing `name` column to Vehicle to match Prisma model
ALTER TABLE `Vehicle`
  ADD COLUMN `name` VARCHAR(191) NOT NULL DEFAULT 'Unknown';

