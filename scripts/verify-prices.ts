import "dotenv/config";
import { prisma } from "../src/data-access/prisma/client.js";

async function verify() {
  const seats = await prisma.showtimeSeat.findMany({
    take: 12,
    where: {
      seat: {
        type: { in: ["STANDARD", "VIP", "COUPLE"] }
      }
    },
    include: {
      seat: true,
      showtime: {
        include: { movie: true, room: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log("================================================================================");
  console.log("SEAT PRICING VERIFICATION IN DATABASE (VIP = 1.25x, COUPLE = 1.5x, STANDARD = 1.0x)");
  console.log("================================================================================");
  seats.forEach((s) => {
    const base = Number(s.showtime.basePrice);
    const actualPrice = Number(s.price);
    const expectedRatio = s.seat.type === "COUPLE" ? "1.5x" : s.seat.type === "VIP" ? "1.25x" : "1.0x";
    console.log(`• Phim: ${s.showtime.movie.title.padEnd(25)} | Rạp/Phòng: ${s.showtime.room.name.padEnd(22)} | Ghế ${s.seat.rowLabel}${s.seat.seatNumber} (${s.seat.type.padEnd(8)}) | Base: ${base.toLocaleString('vi-VN')} đ | Giá vé: ${actualPrice.toLocaleString('vi-VN')} đ (${expectedRatio})`);
  });
  console.log("================================================================================");
}

verify()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
