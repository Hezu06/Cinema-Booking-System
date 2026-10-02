-- CreateTable
CREATE TABLE `seats` (
    `id` VARCHAR(191) NOT NULL,
    `room_id` VARCHAR(191) NOT NULL,
    `row_label` VARCHAR(191) NOT NULL,
    `seat_number` INTEGER NOT NULL,
    `type` ENUM('STANDARD', 'VIP', 'COUPLE') NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `seats_room_id_idx`(`room_id`),
    UNIQUE INDEX `seats_room_id_row_label_seat_number_key`(`room_id`, `row_label`, `seat_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `showtimes` (
    `id` VARCHAR(191) NOT NULL,
    `movie_id` VARCHAR(191) NOT NULL,
    `room_id` VARCHAR(191) NOT NULL,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `base_price` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('SCHEDULED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'SCHEDULED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `showtimes_movie_id_idx`(`movie_id`),
    INDEX `showtimes_room_id_idx`(`room_id`),
    INDEX `showtimes_start_time_idx`(`start_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `showtime_seats` (
    `id` VARCHAR(191) NOT NULL,
    `showtime_id` VARCHAR(191) NOT NULL,
    `seat_id` VARCHAR(191) NOT NULL,
    `status` ENUM('AVAILABLE', 'HELD', 'BOOKED') NOT NULL DEFAULT 'AVAILABLE',
    `price` DECIMAL(10, 2) NOT NULL,
    `held_by_user_id` VARCHAR(191) NULL,
    `hold_expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `showtime_seats_seat_id_idx`(`seat_id`),
    INDEX `showtime_seats_status_idx`(`status`),
    INDEX `showtime_seats_held_by_user_id_idx`(`held_by_user_id`),
    UNIQUE INDEX `showtime_seats_showtime_id_seat_id_key`(`showtime_id`, `seat_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `seats` ADD CONSTRAINT `seats_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `showtimes` ADD CONSTRAINT `showtimes_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `Movie`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `showtimes` ADD CONSTRAINT `showtimes_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `showtime_seats` ADD CONSTRAINT `showtime_seats_showtime_id_fkey` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `showtime_seats` ADD CONSTRAINT `showtime_seats_seat_id_fkey` FOREIGN KEY (`seat_id`) REFERENCES `seats`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `showtime_seats` ADD CONSTRAINT `showtime_seats_held_by_user_id_fkey` FOREIGN KEY (`held_by_user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
