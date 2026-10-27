-- CreateIndex
CREATE INDEX `bookings_status_expires_at_idx` ON `bookings`(`status`, `expires_at`);

-- CreateIndex
CREATE INDEX `showtime_seats_showtime_id_status_hold_expires_at_idx` ON `showtime_seats`(`showtime_id`, `status`, `hold_expires_at`);
