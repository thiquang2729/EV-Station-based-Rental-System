-- Create Booking & Handover tables to match rental-svc Prisma schema

-- CreateTable Booking
CREATE TABLE `Booking` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `stationId` VARCHAR(191) NOT NULL,
  `vehicleId` VARCHAR(191) NOT NULL,
  `startTime` DATETIME(3) NOT NULL,
  `endTime` DATETIME(3) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `priceEstimate` INTEGER NULL,
  `priceFinal` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Handover
CREATE TABLE `Handover` (
  `id` VARCHAR(191) NOT NULL,
  `bookingId` VARCHAR(191) NOT NULL,
  `staffId` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL, -- PICKUP | RETURN
  `checklist` JSON NOT NULL,
  `photos` JSON NOT NULL,
  `odo` INTEGER NOT NULL,
  `notes` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign keys
ALTER TABLE `Booking`
  ADD CONSTRAINT `Booking_stationId_fkey`
  FOREIGN KEY (`stationId`) REFERENCES `Station`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Booking`
  ADD CONSTRAINT `Booking_vehicleId_fkey`
  FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Handover`
  ADD CONSTRAINT `Handover_bookingId_fkey`
  FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

