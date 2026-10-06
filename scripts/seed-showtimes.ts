import { prisma } from "../src/data-access/prisma/client.js";

const DAYS_TO_CREATE = 7;
const DAILY_START_HOURS = [9, 13, 17, 21];
const CLEANUP_MINUTES = 20;
const BASE_PRICE = 90_000;

function atLocalHour(dayOffset: number, hour: number) {
  const value = new Date();
  value.setDate(value.getDate() + dayOffset);
  value.setHours(hour, 0, 0, 0);
  return value;
}

async function main() {
  const [movies, rooms] = await Promise.all([
    prisma.movie.findMany({
      where: { status: { not: "ENDED" } },
      orderBy: [{ status: "desc" }, { title: "asc" }],
    }),
    prisma.room.findMany({
      where: { seats: { some: { active: true } } },
      include: {
        cinema: true,
        seats: { where: { active: true }, select: { id: true } },
      },
      orderBy: [{ cinemaId: "asc" }, { name: "asc" }],
    }),
  ]);

  if (movies.length === 0) throw new Error("Không có phim chưa kết thúc trong database.");
  if (rooms.length === 0) throw new Error("Không có phòng nào có ghế đang hoạt động.");

  const now = new Date();
  let createdCount = 0;
  let skippedCount = 0;

  for (let day = 0; day < DAYS_TO_CREATE; day += 1) {
    for (let roomIndex = 0; roomIndex < rooms.length; roomIndex += 1) {
      const room = rooms[roomIndex]!;

      for (let slotIndex = 0; slotIndex < DAILY_START_HOURS.length; slotIndex += 1) {
        const startTime = atLocalHour(day, DAILY_START_HOURS[slotIndex]!);
        if (startTime.getTime() <= now.getTime() + 30 * 60 * 1000) {
          skippedCount += 1;
          continue;
        }

        const movieIndex = (day * rooms.length * DAILY_START_HOURS.length
          + roomIndex * DAILY_START_HOURS.length
          + slotIndex) % movies.length;
        const movie = movies[movieIndex]!;
        const endTime = new Date(
          startTime.getTime() + (movie.durationMinutes + CLEANUP_MINUTES) * 60 * 1000,
        );

        const overlap = await prisma.showtime.findFirst({
          where: {
            roomId: room.id,
            status: { not: "CANCELLED" },
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
          select: { id: true },
        });

        if (overlap) {
          skippedCount += 1;
          continue;
        }

        await prisma.$transaction(async (tx) => {
          const showtime = await tx.showtime.create({
            data: {
              movieId: movie.id,
              roomId: room.id,
              startTime,
              endTime,
              basePrice: BASE_PRICE,
              status: "SCHEDULED",
            },
          });

          await tx.showtimeSeat.createMany({
            data: room.seats.map((seat) => ({
              showtimeId: showtime.id,
              seatId: seat.id,
              price: BASE_PRICE,
            })),
          });
        });

        createdCount += 1;
        console.log(
          `Đã tạo: ${startTime.toLocaleString("vi-VN")} | ${movie.title} | ${room.cinema.name} - ${room.name}`,
        );
      }
    }
  }

  console.log(`\nHoàn tất: tạo ${createdCount} suất, bỏ qua ${skippedCount} khung giờ.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
