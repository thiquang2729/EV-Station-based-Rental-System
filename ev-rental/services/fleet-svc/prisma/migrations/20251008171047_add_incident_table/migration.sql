-- CreateTable
CREATE TABLE `Station` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `lat` DOUBLE NOT NULL,
    `lng` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vehicle` (
    `id` VARCHAR(191) NOT NULL,
    `stationId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `plate` VARCHAR(191) NOT NULL,
    `batteryLevel` INTEGER NOT NULL,
    `healthStatus` VARCHAR(191) NOT NULL DEFAULT 'OK',
    `pricePerHour` INTEGER NOT NULL,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Vehicle_plate_key`(`plate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Incident` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(191) NOT NULL,
    `stationId` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL,
    `desc` VARCHAR(191) NOT NULL,
    `photos` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_stationId_fkey` FOREIGN KEY (`stationId`) REFERENCES `Station`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Incident` ADD CONSTRAINT `Incident_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
