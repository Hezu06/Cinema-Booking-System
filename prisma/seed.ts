import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/data-access/prisma/client.js";

async function main() {
  console.log("==================================================================");
  console.log("🌱 STARTING DATABASE SEEDING FOR CINEMA BOOKING SYSTEM...");
  console.log("==================================================================\n");

  // -----------------------------------------------------------------------------
  // 1. SEED USERS
  // -----------------------------------------------------------------------------
  console.log("[1/6] Seeding Users (Admin & Customers)...");
  const adminPasswordHash = await bcrypt.hash("Admin123!", 12);
  const userPasswordHash = await bcrypt.hash("Customer123!", 12);

  const users = [
    {
      fullName: "Nguyễn Văn Admin",
      email: "admin@example.com",
      phone: "0900000001",
      passwordHash: adminPasswordHash,
      role: "ADMIN" as const,
      status: "ACTIVE" as const,
    },
    {
      fullName: "Lê Hoàng Khách Hàng",
      email: "customer1@example.com",
      phone: "0900000002",
      passwordHash: userPasswordHash,
      role: "CUSTOMER" as const,
      status: "ACTIVE" as const,
    },
    {
      fullName: "Phạm Minh Khách Hàng",
      email: "customer2@example.com",
      phone: "0900000003",
      passwordHash: userPasswordHash,
      role: "CUSTOMER" as const,
      status: "ACTIVE" as const,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        role: u.role,
        status: u.status,
      },
      create: u,
    });
  }
  console.log(`  ✓ Seeded ${users.length} users successfully.\n`);

  // -----------------------------------------------------------------------------
  // 2. SEED CINEMAS
  // -----------------------------------------------------------------------------
  console.log("[2/6] Seeding Cinemas...");
  const cinemaData = [
    {
      name: "CGV Vincom Nguyễn Chí Thanh",
      city: "Hà Nội",
      address: "54A Nguyễn Chí Thanh, Láng Thượng, Đống Đa, Hà Nội",
    },
    {
      name: "CGV Landmark 81",
      city: "TP. Hồ Chí Minh",
      address: "Tầng B1, Vincom Center Landmark 81, 720A Điện Biên Phủ, P. 22, Bình Thạnh, TP.HCM",
    },
    {
      name: "BHD Star Cineplex Phạm Ngọc Thạch",
      city: "Hà Nội",
      address: "Tầng 8, TTTM Vincom, 2 Phạm Ngọc Thạch, Kim Liên, Đống Đa, Hà Nội",
    },
  ];

  const cinemas: any[] = [];
  for (const c of cinemaData) {
    let cinema = await prisma.cinema.findFirst({
      where: { name: c.name, city: c.city },
    });
    if (!cinema) {
      cinema = await prisma.cinema.create({ data: c });
    } else {
      cinema = await prisma.cinema.update({
        where: { id: cinema.id },
        data: { address: c.address },
      });
    }
    cinemas.push(cinema);
  }
  console.log(`  ✓ Seeded ${cinemas.length} cinemas successfully.\n`);

  // -----------------------------------------------------------------------------
  // 3. SEED ROOMS & SEATS
  // -----------------------------------------------------------------------------
  console.log("[3/6] Seeding Rooms and Seat Layouts...");
  const roomTemplates = [
    { name: "Phòng 1 (Standard 2D)", type: "STANDARD" as const, rows: ["A", "B", "C", "D"], cols: 8 },
    { name: "Phòng 2 (IMAX Laser)", type: "IMAX" as const, rows: ["A", "B", "C", "D", "E"], cols: 8 },
    { name: "Phòng 3 (RealD 3D)", type: "THREE_D" as const, rows: ["A", "B", "C", "D", "E"], cols: 8 },
  ];

  const createdRooms: any[] = [];

  for (const cinema of cinemas) {
    for (const tmpl of roomTemplates) {
      const capacity = tmpl.rows.length * tmpl.cols;
      const room = await prisma.room.upsert({
        where: {
          cinemaId_name: {
            cinemaId: cinema.id,
            name: tmpl.name,
          },
        },
        update: {
          type: tmpl.type,
          capacity,
        },
        create: {
          cinemaId: cinema.id,
          name: tmpl.name,
          type: tmpl.type,
          capacity,
        },
      });
      createdRooms.push(room);

      // Create seats for this room if not already populated
      const existingSeatsCount = await prisma.seat.count({ where: { roomId: room.id } });
      if (existingSeatsCount === 0) {
        const seatsToCreate = [];
        for (const row of tmpl.rows) {
          for (let col = 1; col <= tmpl.cols; col++) {
            // Row A & B: STANDARD, Row C & D: VIP, Row E: COUPLE
            let seatType: "STANDARD" | "VIP" | "COUPLE" = "STANDARD";
            if (row === "C" || row === "D") seatType = "VIP";
            if (row === "E") seatType = "COUPLE";

            seatsToCreate.push({
              roomId: room.id,
              rowLabel: row,
              seatNumber: col,
              type: seatType,
              active: true,
            });
          }
        }
        await prisma.seat.createMany({ data: seatsToCreate });
      }
    }
  }
  console.log(`  ✓ Seeded ${createdRooms.length} rooms with complete seat layouts.\n`);

  // -----------------------------------------------------------------------------
  // 4. SEED MOVIES
  // -----------------------------------------------------------------------------
  console.log("[4/6] Seeding Blockbuster Movies...");
  const movieData = [
    {
      title: "Dune: Hành Tinh Cát - Phần Hai",
      description: "Paul Atreides liên minh cùng Chani và tộc người Fremen để trả thù những kẻ đã hủy hoại gia đình anh, đối mặt với lựa chọn giữa tình yêu của đời mình và số phận của vũ trụ.",
      durationMinutes: 166,
      releaseDate: new Date("2026-03-01T00:00:00Z"),
      posterUrl: "https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
      genre: "Hành động, Khoa học viễn tưởng",
      status: "NOW_SHOWING" as const,
    },
    {
      title: "Godzilla x Kong: Đế Chế Mới",
      description: "Hai quái thú huyền thoại Godzilla và Kong phải hợp sức chống lại mối hiểm họa khổng lồ ẩn sâu bên trong Trái Đất đe dọa sự tồn vong của nhân loại.",
      durationMinutes: 115,
      releaseDate: new Date("2026-03-29T00:00:00Z"),
      posterUrl: "https://image.tmdb.org/t/p/w780/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg",
      genre: "Hành động, Phiêu lưu",
      status: "NOW_SHOWING" as const,
    },
    {
      title: "Kung Fu Panda 4",
      description: "Po phải tìm kiếm và huấn luyện một Thần Long Đại Hiệp mới trước khi nhận chức vị Thủ lĩnh Tinh thần của Thung lũng Hòa Bình, trong khi Tắc Kè Bông biến hình trỗi dậy.",
      durationMinutes: 94,
      releaseDate: new Date("2026-03-08T00:00:00Z"),
      posterUrl: "https://image.tmdb.org/t/p/original/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
      genre: "Hoạt hình, Hài, Gia đình",
      status: "NOW_SHOWING" as const,
    },
    {
      title: "Oppenheimer",
      description: "Câu chuyện chân thực và kịch tính về cuộc đời của nhà vật lý lý thuyết J. Robert Oppenheimer, người chỉ huy Dự án Manhattan chế tạo bom nguyên tử.",
      durationMinutes: 180,
      releaseDate: new Date("2026-01-15T00:00:00Z"),
      posterUrl: "https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      genre: "Tiểu sử, Lịch sử, Chính kịch",
      status: "NOW_SHOWING" as const,
    },
    {
      title: "Deadpool & Wolverine",
      description: "Wolverine đang dưỡng thương thì tình cờ đụng độ Deadpool lắm mồm. Cả hai bất đắc dĩ bắt tay vào một nhiệm vụ sinh tử cứu rỗi đa vũ trụ.",
      durationMinutes: 128,
      releaseDate: new Date("2026-07-26T00:00:00Z"),
      posterUrl: "https://image.tmdb.org/t/p/original/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
      genre: "Hành động, Hài hước, Siêu anh hùng",
      status: "COMING_SOON" as const,
    },
    {
      title: "Avatar: Lửa và Tro Tàn",
      description: "Hành trình tiếp theo của gia đình Jake Sully đưa họ đến vùng đất của Tộc Người Tro - một bộ tộc Na'vi hung hãn và bí hiểm trên hành tinh Pandora.",
      durationMinutes: 190,
      releaseDate: new Date("2026-12-19T00:00:00Z"),
      posterUrl: "https://image.tmdb.org/t/p/original/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
      genre: "Khoa học viễn tưởng, Phiêu lưu",
      status: "COMING_SOON" as const,
    },
  ];

  const movies: any[] = [];
  for (const m of movieData) {
    const movie = await prisma.movie.upsert({
      where: {
        title_releaseDate: {
          title: m.title,
          releaseDate: m.releaseDate,
        },
      },
      update: {
        description: m.description,
        posterUrl: m.posterUrl,
        genre: m.genre,
        status: m.status,
      },
      create: m,
    });
    movies.push(movie);
  }
  console.log(`  ✓ Seeded ${movies.length} movies (4 đang chiếu, 2 sắp chiếu).\n`);

  // -----------------------------------------------------------------------------
  // 5. SEED SHOWTIMES & SHOWTIME SEATS
  // -----------------------------------------------------------------------------
  console.log("[5/6] Seeding Showtimes across Cinema Rooms...");
  const now = new Date();
  const nowShowingMovies = movies.filter((m) => m.status === "NOW_SHOWING");

  // Generate showtimes for Tomorrow and the Day after Tomorrow
  const dayOffsets = [1, 2];
  const timeSlots = [
    { startHour: 10, startMin: 0, endHour: 12, endMin: 30 },
    { startHour: 14, startMin: 15, endHour: 16, endMin: 45 },
    { startHour: 18, startMin: 30, endHour: 21, endMin: 0 },
  ];

  let showtimeCount = 0;

  for (const dayOffset of dayOffsets) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + dayOffset);

    for (let rIdx = 0; rIdx < createdRooms.length; rIdx++) {
      const room = createdRooms[rIdx];
      // Pick movie rotating
      const movie = nowShowingMovies[(rIdx + dayOffset) % nowShowingMovies.length];
      const slot = timeSlots[rIdx % timeSlots.length];

      const startTime = new Date(targetDate);
      startTime.setHours(slot.startHour, slot.startMin, 0, 0);

      const endTime = new Date(targetDate);
      endTime.setHours(slot.endHour, slot.endMin, 0, 0);

      // Check for overlap
      const overlap = await prisma.showtime.findFirst({
        where: {
          roomId: room.id,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });

      if (!overlap) {
        const basePrice = room.type === "IMAX" ? 120000 : 80000;
        const showtime = await prisma.showtime.create({
          data: {
            movieId: movie.id,
            roomId: room.id,
            startTime,
            endTime,
            basePrice,
            status: "SCHEDULED",
          },
        });

        // Create ShowtimeSeat for all room seats
        const roomSeats = await prisma.seat.findMany({
          where: { roomId: room.id, active: true },
        });

        if (roomSeats.length > 0) {
          const showtimeSeatsData = roomSeats.map((seat, idx) => {
            let seatPrice = basePrice;
            if (seat.type === "VIP") seatPrice += 15000;
            if (seat.type === "COUPLE") seatPrice = basePrice * 2;

            // Pre-book 2 seats per showtime for realistic UI
            const isPreBooked = idx === 1 || idx === 2;

            return {
              showtimeId: showtime.id,
              seatId: seat.id,
              price: seatPrice,
              status: isPreBooked ? ("BOOKED" as const) : ("AVAILABLE" as const),
            };
          });

          await prisma.showtimeSeat.createMany({ data: showtimeSeatsData });
        }

        showtimeCount++;
      }
    }
  }
  console.log(`  ✓ Generated ${showtimeCount} new showtimes with seat pricing.\n`);

  // -----------------------------------------------------------------------------
  // 6. SUMMARY
  // -----------------------------------------------------------------------------
  console.log("==================================================================");
  console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
  console.log("==================================================================");
  console.log("Test Credentials:");
  console.log("  • Admin:    admin@example.com     / Admin123!");
  console.log("  • Customer: customer1@example.com / Customer123!");
  console.log("  • Customer: customer2@example.com / Customer123!");
  console.log("==================================================================\n");
}

main()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
