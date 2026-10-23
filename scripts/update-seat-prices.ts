import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { prisma } from "../src/data-access/prisma/client.js";

async function main() {
  console.log("Updating showtime_seats prices atomically via raw SQL...");
  const updatedRows = await prisma.$executeRawUnsafe(`
    UPDATE showtime_seats ss
    JOIN seats s ON ss.seat_id = s.id
    JOIN showtimes st ON ss.showtime_id = st.id
    SET ss.price = CASE 
      WHEN s.type = 'COUPLE' THEN ROUND(st.base_price * 1.5)
      WHEN s.type = 'VIP' THEN ROUND(st.base_price * 1.25)
      ELSE st.base_price
    END
  `);
  console.log(`✓ Updated ${updatedRows} showtime_seats rows in DB!`);

  // Verify sample seats across different seat types
  const sampleSeats: any[] = await prisma.$queryRawUnsafe(`
    SELECT m.title, r.name as roomName, s.row_label as rowLabel, s.seat_number as seatNumber, s.type, st.base_price as basePrice, ss.price
    FROM showtime_seats ss
    JOIN seats s ON ss.seat_id = s.id
    JOIN showtimes st ON ss.showtime_id = st.id
    JOIN movies m ON st.movie_id = m.id
    JOIN rooms r ON st.room_id = r.id
    WHERE s.type IN ('STANDARD', 'VIP', 'COUPLE')
    LIMIT 9
  `);

  console.log("\nSample verified showtime seats from DB:");
  sampleSeats.forEach((row) => {
    console.log(`- [${row.title}] ${row.roomName} | Ghế ${row.rowLabel}${row.seatNumber} (${row.type}): Giá gốc ${Number(row.basePrice).toLocaleString('vi-VN')} đ => Giá vé: ${Number(row.price).toLocaleString('vi-VN')} đ`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
