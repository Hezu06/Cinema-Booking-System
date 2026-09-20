# 🎬 Cinema Booking System - Docker Setup & Onboarding Guide

Tài liệu hướng dẫn chi tiết dành cho toàn bộ thành viên trong team khi clone/pull dự án về máy, cách khởi chạy hệ thống bằng Docker, kiểm thử API qua Swagger UI và các lưu ý kỹ thuật quan trọng.

---

## 📋 1. Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
- **Docker Desktop** (bản mới nhất) kèm Docker Compose v2.
  - *Lưu ý trên Windows*: Hãy đảm bảo đã bật **WSL 2 backend** trong Docker Desktop settings (`General` -> `Use the WSL 2 based engine`).
  - Đảm bảo Docker Desktop đang chạy (icon cá voi ở thanh tác vụ không bị đỏ/tắt).
- **Git**: Dùng để clone/pull code từ repository.
- **Node.js v22+** *(tùy chọn)*: Chỉ cần thiết nếu bạn muốn chạy dự án trực tiếp ở máy thật (Local Host) thay vì chạy trong container.

---

## 🚀 2. Quy trình khi mới Clone / Pull code về (Bắt buộc làm)

Mỗi khi bạn mới **clone repo** về máy, hoặc vừa **pull branch mới** có cập nhật từ Git:

### **Bước 1: Tạo file cấu hình môi trường `.env`**
File `.env` chứa cấu hình kết nối database và các secret keys (không được commit lên git). Tạo file `.env` từ file mẫu:

- **Trên Windows PowerShell:**
  ```powershell
  copy .env.example .env
  ```
- **Trên Linux / macOS / Git Bash:**
  ```bash
  cp .env.example .env
  ```

*(Mặc định file `.env.example` đã được cấu hình sẵn thông số kết nối khớp với service MySQL trong Docker: `cbs:cbs_password@mysql:3306/cinema_booking`, bạn không cần sửa gì thêm để chạy với Docker)*.

---

### **Bước 2: Khởi động hệ thống bằng Docker Compose**

Chạy lệnh sau tại thư mục gốc của dự án:

```bash
docker compose up -d --build
```

> [!TIP]
> **Giải thích:**
> - Cờ `--build` sẽ tự động build lại image nếu có bất kỳ thay đổi nào trong mã nguồn hoặc `package.json` (cài thêm thư viện mới).
> - Nhờ cấu hình **Selective Bind Mount** (`./src:/app/src`), toàn bộ thư viện `node_modules` bên trong container luôn được cập nhật chính xác từ image mà **không cần bất kỳ cờ đặc biệt nào khác**.

---

### **Bước 3: Kiểm tra hệ thống**

1. **Kiểm tra trạng thái containers:**
   ```bash
   docker compose ps
   ```
   *Cả 2 container `cbs-mysql` (healthy) và `cbs-app` đều ở trạng thái `Up`.*

2. **Xem logs container app:**
   ```bash
   docker compose logs -f app
   ```
   *(Thấy dòng `Cinema Booking System API running on port 5000` là ứng dụng đã khởi động thành công. Bấm `Ctrl + C` để thoát xem log).*

---

## 📑 3. Bảng tra cứu lệnh chạy hàng ngày (Daily Cheat Sheet)

Hàng ngày làm việc, bạn chỉ cần dùng các lệnh cơ bản sau:

| Tình huống thực tế | Lệnh cần chạy | Giải thích |
| :--- | :--- | :--- |
| **Bật app làm việc hàng ngày** *(code logic thông thường)* | `docker compose up -d` | Rất nhanh. Nhờ tính năng mount volume `./src` và `tsx watch`, bạn sửa code trong `src/` là container tự động cập nhật ngay lập tức (Auto-reload). |
| **Tắt app khi hết ngày làm việc** | `docker compose stop` | Tạm dừng containers, không mất dữ liệu. |
| **Khi `git pull` có code mới hoặc thư viện mới** | `docker compose up -d --build` | Tự động rebuild image và cập nhật mã nguồn mới nhất. |
| **Tắt và dọn dẹp containers** | `docker compose down` | Xóa container & network tạm, giữ nguyên dữ liệu MySQL. |
| **Xóa trắng toàn bộ làm lại từ đầu** *(Reset sạch cả DB)* | `docker compose down -v` | ⚠️ **Cẩn thận:** Xóa sạch dữ liệu database đã tạo để tạo môi trường trắng tinh. |

---

## 🌐 4. Kiểm thử API qua Swagger UI (Không cần Postman)

Dự án đã tích hợp sẵn giao diện **Swagger UI** để cả team có thể xem tài liệu mô tả API và gửi request test trực tiếp trên trình duyệt web.

### **Đường dẫn truy cập:**
👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

*(Nếu bạn chạy bằng `npm run dev` ở máy host ngoài Docker, cổng sẽ là [http://localhost:3000/api-docs](http://localhost:3000/api-docs))*.

### **Các nhóm API trên Swagger:**
1. **Kiểm tra sức khỏe hệ thống (Health Check)**: `GET /health`
2. **Quản lý Auth (`/api/auth`)**:
   - `POST /api/auth/register`: Đăng ký tài khoản mới (họ tên, email, password, số điện thoại).
   - `POST /api/auth/login`: Đăng nhập lấy `accessToken` (JWT).
   - `GET /api/auth/me`: Xem thông tin profile của user hiện tại (yêu cầu Bearer Token).
3. **Quản lý Phim (`/api/movies`)**:
   - `GET /api/movies`: Lấy danh sách phim.
   - `POST /api/movies`: Thêm phim mới.
   - `GET /api/movies/{id}`: Chi tiết phim theo UUID.
   - `PUT /api/movies/{id}`: Sửa phim.
   - `DELETE /api/movies/{id}`: Xóa phim.

### 💡 Hướng dẫn gửi request có Token xác thực (JWT) trên Swagger:
1. Mở endpoint `POST /api/auth/login`, bấm **Try it out**, nhập tài khoản mật khẩu và bấm **Execute**.
2. Copy chuỗi `accessToken` trong phần Response Body trả về.
3. Cuộn lên đầu trang Swagger, bấm vào nút **Authorize 🔓** (màu xanh lá ở góc phải).
4. Dán token vừa copy vào ô **Value** *(lưu ý: không cần gõ thêm chữ `Bearer `)*.
5. Bấm nút **Authorize** rồi bấm **Close**.
6. Bây giờ các API yêu cầu đăng nhập như `GET /api/auth/me` sẽ tự động đính kèm token khi bạn bấm Execute.

---

## 📊 5. Quản trị Database & Prisma trong Docker

Database MySQL (`mysql:8.4`) đã được cấu hình tự động:
- **Tự động chạy Migration**: Mỗi khi container app khởi động, script [entrypoint.sh](file:///C:/Users/nguye/source/repos/Cinema-Booking-System/entrypoint.sh) sẽ tự động chạy `npx prisma migrate deploy` để đồng bộ các bảng mới nhất vào database.

### Các thao tác thường dùng:

1. **Mở giao diện trực quan Prisma Studio (Database GUI):**
   ```bash
   docker compose exec app npx prisma studio
   ```
   Sau đó mở trình duyệt tại: **http://localhost:5555** để xem, sửa, thêm dữ liệu các bảng `User`, `Movie` trực quan.

2. **Chạy Migration thủ công bên trong container:**
   ```bash
   docker compose exec app npx prisma migrate deploy
   ```

3. **Truy cập MySQL qua dòng lệnh CLI:**
   ```bash
   docker compose exec mysql mysql -u cbs -pcbs_password cinema_booking
   ```

---

## 📦 6. Danh sách các Cổng (Ports) trên máy Host

| Service / Tính năng | Port | Đường dẫn URL | Mô tả |
| :--- | :--- | :--- | :--- |
| **API Server & Swagger** | `5000` | [http://localhost:5000/api-docs](http://localhost:5000/api-docs) | Giao diện tài liệu API và các endpoints |
| **Health Check** | `5000` | [http://localhost:5000/health](http://localhost:5000/health) | Kiểm tra trạng thái máy chủ |
| **MySQL Database** | `3306` | `localhost:3306` | Kết nối DB qua DBeaver, TablePlus, Workbench |
| **Prisma Studio** | `5555` | [http://localhost:5555](http://localhost:5555) | Giao diện xem dữ liệu database |
| **Node.js Debugger** | `9229` | `chrome://inspect` | Port đính kèm debugger cho VSCode / Chrome |

---

## 🐛 7. Xử lý các sự cố thường gặp (Troubleshooting)

### 🔴 1. Lỗi xung đột cổng `3306` hoặc `5000` (`port is already allocated`)
- **Nguyên nhân**: Máy tính của bạn đang có một phiên bản MySQL cài sẵn (XAMPP, MySQL Server) hoặc một service khác đang chạy chiếm cổng 3306/5000.
- **Cách xử lý**:
  - Tắt service MySQL local ở Services (Windows: `services.msc` -> tìm `MySQL` -> bấm `Stop`).
  - Hoặc sửa file [docker-compose.yml](file:///C:/Users/nguye/source/repos/Cinema-Booking-System/docker-compose.yml):
    ```yaml
    ports:
      - "3307:3306" # Đổi cổng ngoài máy host thành 3307 thay vì 3306
    ```

### 🔴 2. Container MySQL không khởi động được hoặc bị exited
- **Cách kiểm tra log**:
  ```bash
  docker compose logs mysql
  ```
- **Reset lại môi trường DB sạch nếu bị hỏng dữ liệu**:
  ```bash
  docker compose down -v
  docker compose up -d --build
  ```

---

## 🏗️ 8. Cấu trúc Build Dockerfile chi tiết

Dự án áp dụng mô hình **Multi-stage Build** tối ưu trong [Dockerfile](file:///C:/Users/nguye/source/repos/Cinema-Booking-System/Dockerfile):

```
1. Builder Stage (node:22-alpine):
   ├── Cài đặt build tools (gcc, g++, make, python3)
   ├── npm ci (cài đặt đầy đủ dependencies)
   ├── npx prisma generate (sinh Prisma Client vào /app/generated/prisma)
   └── npm run build (biên dịch TypeScript sang dist/src/server.js)

2. Production Stage (node:22-alpine):
   ├── Runtime tối giản, cài dumb-init, curl, bash
   ├── npm ci --omit=dev (chỉ giữ production dependencies)
   ├── Copy /app/dist và /app/generated từ Builder Stage
   ├── Tạo non-root user (nodejs) để chạy container an toàn
   └── entrypoint.sh: Tự động chạy Prisma migration và khởi chạy node dist/src/server.js
```

---

Chúc team phát triển dự án hiệu quả và thuận lợi! 🚀
