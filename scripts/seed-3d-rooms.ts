import { prisma } from "../src/data-access/prisma/client.js";

async function seed3dRooms() {
  console.log("================================================================================");
  console.log("👓 SEEDING REALD 3D ROOMS & SEAT LAYOUTS FOR ALL CINEMAS");
  console.log("================================================================================");

  const cinemas = await prisma.cinema.findMany();
  console.log(`Tìm thấy ${cinemas.length} cụm rạp cần cấu hình phòng chiếu 3D.`);

  const tmpl = {
    name: "Phòng 3 (RealD 3D)",
    type: "THREE_D" as const,
    rows: ["A", "B", "C", "D", "E"],
    cols: 8,
  };
  const capacity = tmpl.rows.length * tmpl.cols;

  for (const cinema of cinemas) {
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

    const seatCount = await prisma.seat.count({ where: { roomId: room.id } });
    if (seatCount === 0) {
      const seatsToCreate = [];
      for (const row of tmpl.rows) {
        for (let col = 1; col <= tmpl.cols; col++) {
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
      console.log(`  ✓ Đã khởi tạo ${room.name} với ${seatsToCreate.length} ghế tại [${cinema.name}]`);
    } else {
      console.log(`  ✓ ${cinema.name} - ${room.name} đã tồn tại với ${seatCount} ghế.`);
    }
  }

  console.log("================================================================================");
  console.log("🎉 HOÀN THÀNH CẤU HÌNH PHÒNG CHIẾU 3D TOÀN HỆ THỐNG!");
  console.log("================================================================================");
}

seed3dRooms()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Lỗi khởi tạo phòng 3D:", err);
    process.exit(1);
  });
