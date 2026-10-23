import { PrismaMovieRepository } from "../src/data-access/repositories/movie.repository.js";
import { PrismaShowtimeRepository } from "../src/data-access/repositories/showtime.repository.js";
import { PrismaRoomRepository } from "../src/data-access/repositories/room.repository.js";
import { tmdbGateway } from "../src/data-access/gateways/tmdb.gateway.js";
import { MovieService } from "../src/business/services/movie.service.js";

async function runSync() {
  console.log("================================================================================");
  console.log("🎬 CINEMA BOOKING SYSTEM - TỰ ĐỘNG ĐỒNG BỘ PHIM MỚI & TẠO LỊCH CHIẾU");
  console.log("   Nguồn dữ liệu: TheMovieDB (TMDB API) / Curated Blockbuster Fallback");
  console.log("   Bảo vệ kiến trúc: Circuit Breaker Pattern (Martin Fowler)");
  console.log("================================================================================");

  const movieRepository = new PrismaMovieRepository();
  const showtimeRepository = new PrismaShowtimeRepository();
  const roomRepository = new PrismaRoomRepository();
  const movieService = new MovieService(movieRepository, tmdbGateway, showtimeRepository, roomRepository);

  console.log(`\n⏳ Trạng thái Circuit Breaker TMDB ban đầu: ${tmdbGateway.breaker.getState()}`);
  console.log("▶ Đang gọi TMDB Gateway để kéo danh sách phim mới nhất...\n");

  const startTime = Date.now();
  const result = await movieService.syncExternalMovies({
    autoCreateShowtimes: true,
    markEndedOlderThanDays: 60,
  });
  const elapsed = Date.now() - startTime;

  console.log("================================================================================");
  console.log("✅ KẾT QUẢ ĐỒNG BỘ DỮ LIỆU PHIM");
  console.log("================================================================================");
  console.log(`• Tổng số phim lấy về (Fetched):   ${result.totalFetched}`);
  console.log(`• Phim mới được thêm vào DB:       ${result.added}`);
  console.log(`• Phim đã cập nhật thông tin:      ${result.updated}`);
  console.log(`• Phim quá hạn chuyển sang ENDED:  ${result.markedEnded}`);
  console.log(`• Suất chiếu mới được tạo tự động: ${result.showtimesCreated}`);
  console.log(`• Thời gian thực thi:              ${elapsed}ms`);
  console.log(`• Trạng thái Circuit Breaker cuối: ${tmdbGateway.breaker.getState()}`);
  console.log("--------------------------------------------------------------------------------");
  console.log("📋 CHI TIẾT DANH SÁCH PHIM XỬ LÝ:");
  console.table(
    result.details.map((d, index) => ({
      STT: index + 1,
      "Tên phim": d.title,
      "Hành động": d.action === "CREATED" ? "MỚI (+)" : d.action === "UPDATED" ? "CẬP NHẬT (~)" : "BỎ QUA",
      "Trạng thái": d.status,
    }))
  );
  console.log("================================================================================");
}

runSync()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Lỗi trong quá trình đồng bộ phim:", err);
    process.exit(1);
  });
