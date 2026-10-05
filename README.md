# Cinema Booking System — Sọt phim

**Sọt phim** là hệ thống đặt vé xem phim do Nhóm 8 phát triển trong môn Kiến trúc phần mềm. Hệ thống cung cấp giao diện khách hàng để tra cứu phim, lựa chọn suất chiếu, chọn ghế và quản lý vé cá nhân. Backend cung cấp REST API phục vụ đặt vé và quản lý dữ liệu rạp chiếu, với cơ chế xác thực và phân quyền theo vai trò.

| Tài nguyên | Đường dẫn |
| --- | --- |
| Giao diện triển khai | [cbs-project8.vercel.app](https://cbs-project8.vercel.app/) |
| Swagger UI triển khai | [Tài liệu Cinema Booking System API](https://cinema-booking-system-esvw.onrender.com/api-docs) |
| Backend triển khai | [Render](https://cinema-booking-system-esvw.onrender.com) |
| Mã nguồn | [Cinema-Booking-System](https://github.com/Hezu06/Cinema-Booking-System) |
| Tài liệu đặc tả | [CBS Docs](https://docs.google.com/document/d/1B_aNnkKWiQXstp545iEiL28QV7SFEieEPcsvvMGbnbI/edit?usp=drivesdk) |

## Mục lục

1. [Thông tin nhóm](#1-thông-tin-nhóm)
2. [Mục tiêu và phạm vi](#2-mục-tiêu-và-phạm-vi)
3. [Chức năng hệ thống](#3-chức-năng-hệ-thống)
4. [Công nghệ](#4-công-nghệ)
5. [Kiến trúc phần mềm](#5-kiến-trúc-phần-mềm)
6. [Mô hình dữ liệu và nghiệp vụ](#6-mô-hình-dữ-liệu-và-nghiệp-vụ)
7. [Cấu trúc mã nguồn](#7-cấu-trúc-mã-nguồn)
8. [Chạy localhost](#8-chạy-localhost)
9. [Biến môi trường](#9-biến-môi-trường)
10. [API và kiểm thử bằng Swagger](#10-api-và-kiểm-thử-bằng-swagger)
11. [Kiểm tra build và kiểm thử chức năng](#11-kiểm-tra-build-và-kiểm-thử-chức-năng)
12. [Kiểm thử tải và tranh chấp ghế](#12-kiểm-thử-tải-và-tranh-chấp-ghế)
13. [Triển khai và vận hành](#13-triển-khai-và-vận-hành)
14. [Phạm vi hoàn thiện và hướng phát triển](#14-phạm-vi-hoàn-thiện-và-hướng-phát-triển)

## 1. Thông tin nhóm

| Nội dung | Thông tin |
| --- | --- |
| Tên môn học | Kiến trúc phần mềm |
| Mã lớp học phần | INT3105 2 |
| Giảng viên | PGS.TS. Võ Đình Hiếu |
| Tên dự án | Hệ thống đặt vé xem phim (Cinema Booking System) |
| Nhóm | Nhóm 8 |

### Thành viên nhóm

| STT | Họ và tên | MSSV |
| ---: | --- | --- |
| 1 | Đặng Ngọc Minh | 24020227 |
| 2 | Nguyễn Trung Hiếu | 24020128 |
| 3 | Vũ Thị Huyền Chang | 24020045 |

## 2. Mục tiêu và phạm vi

### Mục tiêu

- Cung cấp hành trình đặt vé từ tra cứu phim đến nhận thông tin booking và vé.
- Quản lý tập trung phim, rạp, phòng, ghế và suất chiếu.
- Tổ chức backend theo các tầng API, Business và Data Access để phân chia trách nhiệm và thuận tiện bảo trì.
- Xác thực bằng JWT, phân quyền `CUSTOMER`/`ADMIN` và kiểm tra quyền sở hữu booking.
- Xử lý trạng thái ghế theo từng suất chiếu, sử dụng transaction và cập nhật có điều kiện khi giữ hoặc đặt ghế.
- Cung cấp Swagger UI để mô tả và thử nghiệm API.

### Phạm vi phiên bản hiện tại

Hệ thống gồm frontend khách hàng và các module backend Auth, Movie, Cinema, Room, Seat, Showtime, Booking. Vé được tạo và truy xuất trong luồng Booking.

Phiên bản hiện tại có cơ chế giữ ghế theo thời hạn. Giao diện thanh toán cung cấp lựa chọn phương thức, nhưng thao tác hoàn tất gọi API tạo booking. Hệ thống chưa xử lý giao dịch tiền thật qua ngân hàng hoặc ví điện tử, chưa có hoàn tiền tự động và chưa tích hợp thiết bị soát vé.

## 3. Chức năng hệ thống

### Khách hàng

| Chức năng | Mô tả |
| --- | --- |
| Đăng ký | Kiểm tra thông tin và tạo tài khoản mặc định có quyền `CUSTOMER`. |
| Đăng nhập | Xác thực email/mật khẩu và trả JWT access token. |
| Xem danh sách phim | Lấy phim từ API và hiển thị trên giao diện khách hàng. |
| Xem chi tiết phim | Xem mô tả, thể loại, thời lượng, ngày phát hành và poster. |
| Xem suất chiếu | Tra cứu theo phim, rạp, phòng, ngày và trạng thái. |
| Xem ghế theo suất chiếu | Lấy sơ đồ ghế và trạng thái `AVAILABLE`, `HELD`, `BOOKED`. |
| Đặt vé | Kiểm tra suất chiếu và ghế, tạo booking cùng các vé tương ứng. |
| Xem booking cá nhân | Xem danh sách và chi tiết booking thuộc tài khoản đang đăng nhập. |
| Hủy booking | Kiểm tra quyền, thời điểm suất chiếu và trạng thái; hủy vé và giải phóng ghế. |

Hệ thống cung cấp API giữ và nhả ghế, kèm thời gian đếm ngược trên giao diện. Trang chọn ghế cập nhật trạng thái bằng polling khoảng **3,5 giây** khi tab đang hiển thị.

### Quản trị viên

| Chức năng | Mô tả |
| --- | --- |
| Quản lý phim | Thêm, cập nhật và xóa dữ liệu phim qua API. |
| Quản lý rạp | Quản lý tên, địa chỉ và thành phố của rạp. |
| Quản lý phòng | Quản lý phòng thuộc rạp, loại phòng và sức chứa. |
| Quản lý ghế | Quản lý vị trí, loại ghế và trạng thái hoạt động của ghế vật lý. |
| Quản lý suất chiếu | Tạo/cập nhật/xóa lịch chiếu, kiểm tra tham chiếu và lịch chồng lấn. |
| Xem toàn bộ booking | Tra cứu booking trên hệ thống với quyền `ADMIN`. |

Các thao tác quản trị thực hiện qua REST API và yêu cầu quyền Admin. Swagger UI hỗ trợ gọi và kiểm thử các API này.

## 4. Công nghệ

| Thành phần | Công nghệ | Vai trò |
| --- | --- | --- |
| Frontend | React, TypeScript | Xây dựng giao diện và luồng tương tác khách hàng. |
| Công cụ frontend | Vite, Tailwind CSS, React Router, Lucide React | Chạy/build ứng dụng, định dạng giao diện, điều hướng và biểu tượng. |
| Backend | Node.js, Express 5, TypeScript | Xử lý REST API và nghiệp vụ. |
| Validation | Zod | Kiểm tra body, params và query tại Controller. |
| Xác thực | jsonwebtoken, bcryptjs | Tạo/xác minh JWT và băm mật khẩu. |
| HTTP middleware | Helmet, CORS | Thiết lập header và hỗ trợ request từ frontend. |
| Truy cập dữ liệu | Prisma 7, `@prisma/adapter-mariadb`, MariaDB driver | Truy vấn cơ sở dữ liệu MySQL bằng Prisma Client. |
| Cơ sở dữ liệu | MySQL | Lưu dữ liệu, quan hệ, ràng buộc và transaction. |
| Tài liệu API | Swagger UI, OpenAPI 3.0.3 | Mô tả endpoint, schema và thử request. |
| Đóng gói | Docker, Docker Compose | Chạy backend và MySQL 8.4 trong môi trường local. |
| Môi trường cloud | Vercel, Render, Railway | Frontend, backend và MySQL triển khai của nhóm. |

Phiên bản phụ thuộc chính xác được quản lý trong `package-lock.json` và `client/package-lock.json`.

## 5. Kiến trúc phần mềm

Backend là **monolith phân tầng**: các module chạy trong một ứng dụng Express, dùng chung MySQL. Frontend và backend giao tiếp qua HTTP/HTTPS với JSON; frontend không truy cập trực tiếp database.

```mermaid
flowchart TD
    FE["React Frontend"] -->|HTTP / JSON| API
    SW["Swagger UI / REST Client"] -->|HTTP / JSON| API
    subgraph BE["Express Backend"]
        API["API: Routes, Middleware, Controller, Validator"]
        BUS["Business: Services, Models, Interfaces"]
        DATA["Data Access: Repositories, Prisma"]
        API --> BUS
        BUS --> DATA
    end
    DATA --> DB[("MySQL")]
```

### Trách nhiệm từng tầng

| Tầng | Vị trí | Trách nhiệm |
| --- | --- | --- |
| API | `src/api/` | Khai báo route, xác thực JWT, kiểm tra role, validate dữ liệu, gọi Service và trả response. |
| Business | `src/business/` | Định nghĩa model/interface và xử lý quy tắc nghiệp vụ; Service nhận Repository qua constructor. |
| Data Access | `src/data-access/` | Truy vấn Prisma, ánh xạ dữ liệu và thực hiện transaction. |
| Cấu hình dùng chung | `src/config/`, `src/shared/` | Tài liệu Swagger và tiện ích xác thực. |

Controller kiểm tra dữ liệu bằng Zod và chuyển kết quả xử lý thành phản hồi HTTP. Service làm việc với model và interface, độc lập với đối tượng request/response của Express. Booking Repository thực hiện transaction cho các thao tác giữ, đặt và hủy ghế.

### Luồng đặt vé

1. Frontend lấy phim, suất chiếu và các `ShowtimeSeat` của suất chiếu.
2. Khách hàng đăng nhập, chọn ghế và gọi API giữ ghế khi tiếp tục sang bước xác nhận.
3. Controller kiểm tra request; middleware xác thực tài khoản; Service kiểm tra danh sách ghế.
4. Repository kiểm tra suất chiếu và trạng thái ghế, cập nhật ghế có điều kiện trong transaction.
5. Backend tạo `Booking`, `BookingSeat`, `Ticket`, tính tổng tiền từ giá ghế trong database rồi trả chi tiết booking.
6. Frontend chuyển sang màn hình kết quả và cho phép xem vé trong tài khoản cá nhân.

## 6. Mô hình dữ liệu và nghiệp vụ

### Các thực thể dữ liệu

Schema hiện có **10 model**, được định nghĩa tại `prisma/schema.prisma`.

| Model | Bảng MySQL | Ý nghĩa |
| --- | --- | --- |
| `User` | `User` | Tài khoản, thông tin liên hệ, mật khẩu băm, role và trạng thái. |
| `Movie` | `Movie` | Thông tin phim và trạng thái phát hành. |
| `Cinema` | `cinemas` | Rạp chiếu và địa chỉ. |
| `Room` | `rooms` | Phòng thuộc rạp, loại phòng và sức chứa. |
| `Seat` | `seats` | Ghế vật lý trong phòng. |
| `Showtime` | `showtimes` | Phim chiếu trong một phòng vào khoảng thời gian xác định. |
| `ShowtimeSeat` | `showtime_seats` | Ghế của một suất chiếu, giá vé và thông tin giữ chỗ. |
| `Booking` | `bookings` | Đơn đặt vé của người dùng. |
| `BookingSeat` | `booking_seats` | Các ghế và giá ghi nhận trong một booking. |
| `Ticket` | `tickets` | Vé tương ứng với từng BookingSeat. |

```mermaid
erDiagram
    Cinema ||--o{ Room : contains
    Room ||--o{ Seat : contains
    Room ||--o{ Showtime : hosts
    Movie ||--o{ Showtime : screens
    Showtime ||--o{ ShowtimeSeat : provides
    Seat ||--o{ ShowtimeSeat : participates
    User ||--o{ Booking : creates
    Showtime ||--o{ Booking : receives
    Booking ||--o{ BookingSeat : contains
    ShowtimeSeat ||--o{ BookingSeat : records
    Booking ||--o{ Ticket : issues
    BookingSeat ||--o| Ticket : generates
```

`Seat` mô tả vị trí ghế vật lý trong phòng; `ShowtimeSeat` quản lý giá và trạng thái của vị trí đó theo từng suất chiếu. `BookingSeat` lưu thông tin ghế và giá vé của từng booking, bao gồm lịch sử booking đã hủy.

### Quy tắc nghiệp vụ

- Email và số điện thoại có ràng buộc duy nhất; mật khẩu được băm bằng bcryptjs.
- Đăng ký không nhận quyền Admin từ client; người dùng mới có quyền `CUSTOMER`.
- API quản trị yêu cầu JWT và role `ADMIN`. Middleware kiểm tra tài khoản tồn tại và đang `ACTIVE`.
- Phòng phải thuộc rạp; ghế phải thuộc phòng; suất chiếu gắn với một phim và một phòng.
- Tên phòng duy nhất trong cùng rạp; vị trí ghế duy nhất theo phòng, hàng và số ghế.
- Trạng thái bán/giữ chỗ nằm ở `ShowtimeSeat`, không nằm trên ghế vật lý `Seat`.
- Suất chiếu phải có thời gian bắt đầu trước kết thúc. Service kiểm tra lịch chồng lấn trong cùng phòng khi tạo/cập nhật.
- Một yêu cầu giữ/đặt vé có từ **1 đến 8 ghế**, không chấp nhận danh sách chứa ID trùng.
- Giữ ghế mặc định **10 phút**; API nhận `durationMinutes` từ **1 đến 30**. Frontend hiện gửi 10 phút.
- Không đặt ghế đã `BOOKED`, ghế bị vô hiệu hóa hoặc ghế đang được người khác giữ còn hạn. Suất chiếu phải là `SCHEDULED` và chưa bắt đầu.
- Tổng tiền được tính từ `ShowtimeSeat.price` trong database. Booking tạo thành công có trạng thái `CONFIRMED`; vé có trạng thái `VALID`.
- Khách hàng chỉ xem/hủy booking của mình; Admin có thể thao tác booking của người khác theo logic hiện tại.
- Không hủy booking đã hủy hoặc khi suất chiếu đã bắt đầu. Hủy hợp lệ cập nhật booking/vé sang `CANCELLED` và trả ghế về `AVAILABLE`.

**Hết hạn giữ ghế:** hệ thống xử lý các hold hết hạn khi đọc sơ đồ ghế và thực hiện thao tác giữ hoặc đặt ghế.

**Xử lý tranh chấp ghế:** thao tác giữ và đặt ghế sử dụng transaction, cập nhật có điều kiện và kiểm tra số bản ghi cập nhật. Kết quả kiểm thử giữ ghế đồng thời được trình bày tại mục 12.

## 7. Cấu trúc mã nguồn

```text
Cinema-Booking-System/
├── client/
│   ├── src/
│   │   ├── api/                 # HTTP client và các hàm gọi API
│   │   ├── components/          # Auth, layout, movie, booking
│   │   ├── context/             # Trạng thái xác thực
│   │   ├── pages/               # Phim, suất chiếu, chọn ghế, booking, tài khoản
│   │   ├── types/               # Kiểu dữ liệu frontend
│   │   └── App.tsx              # React Router
│   ├── public/                  # Tài nguyên giao diện
│   ├── vite.config.ts           # Dev server và proxy /api
│   ├── vercel.json              # SPA rewrite
│   └── package.json
├── src/
│   ├── api/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   └── validators/
│   ├── business/
│   │   ├── interfaces/
│   │   ├── models/
│   │   └── services/
│   ├── data-access/
│   │   ├── prisma/client.ts
│   │   └── repositories/
│   ├── config/swagger/
│   │   ├── paths/
│   │   └── schemas/
│   ├── shared/auth/
│   ├── app.ts
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── prisma.config.ts
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh
├── DOCKER_SETUP.md
├── package.json
└── tsconfig.json
```

## 8. Chạy localhost

### 8.1. Yêu cầu môi trường

- Git để clone repository.
- **Node.js 22 LTS, phiên bản 22.12 trở lên**, và npm.
- Docker và Docker Compose v2 nếu chạy MySQL/backend bằng container.
- MySQL 8.4 nếu tự cài database thay vì dùng container.
- Cổng **3306**, **5000**, **5173** khả dụng.

Clone mã nguồn:

```bash
git clone --branch main https://github.com/Hezu06/Cinema-Booking-System.git
cd Cinema-Booking-System
```

Nếu dùng ZIP, giải nén và mở terminal tại thư mục chứa `package.json`, `docker-compose.yml` và `client/`.

### 8.2. Cấu hình backend

Sao chép file môi trường tại thư mục gốc.

Linux/macOS/WSL/Git Bash:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Chỉnh `.env` để thống nhất backend với proxy frontend:

```dotenv
DATABASE_URL="mysql://cbs:cbs_password@localhost:3306/cinema_booking"
PORT=5000
JWT_SECRET="THAY_BANG_CHUOI_NGAU_NHIEN_CUA_BAN"
JWT_EXPIRES_IN="1h"
```

Có thể tạo chuỗi bí mật local bằng:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Dán kết quả vào `JWT_SECRET`. `SHADOW_DATABASE_URL` chỉ cần khi phát triển migration bằng `migrate dev`. Để áp dụng migration có sẵn bằng `migrate deploy`, có thể bỏ biến này khỏi `.env`.

Sử dụng **PORT=5000** để khớp với proxy trong `client/vite.config.ts` và cấu hình Docker Compose.

### 8.3. Cách A — Backend và MySQL bằng Docker

Tại thư mục gốc:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

Docker Compose chờ MySQL ở trạng thái healthy trước khi khởi động app. Entrypoint áp dụng migration. Nhấn `Ctrl+C` để thoát màn hình log mà vẫn giữ container hoạt động.

Kiểm tra trạng thái migration khi cần:

```bash
docker compose exec app npx prisma migrate status
```

Các URL backend:

- Health: http://localhost:5000/health
- Swagger: http://localhost:5000/api-docs
- REST API: http://localhost:5000/api

Docker Compose chạy MySQL và backend. Frontend chạy riêng trên máy local. Mở terminal thứ hai tại thư mục gốc:

```bash
npm ci --prefix client
npm run client:dev
```

Mở http://localhost:5173. Vite chuyển request `/api` đến `http://localhost:5000`.

Dừng môi trường:

```bash
docker compose down
```

Lệnh này giữ dữ liệu trong volume MySQL. `docker compose down -v` xóa volume và toàn bộ dữ liệu local; chỉ dùng khi chủ động muốn reset.

App container kết nối tới service `mysql` theo cấu hình trong `docker-compose.yml`. Để sử dụng database khác, điều chỉnh chuỗi kết nối tại file Compose.

### 8.4. Cách B — Backend trực tiếp bằng Node.js

Cách này thuận tiện khi cần sửa backend và tự động tải lại code.

Khởi động riêng MySQL local:

```bash
docker compose up -d mysql
```

Chờ MySQL healthy bằng `docker compose ps`. Nếu app Docker đang chiếm cổng 5000, dừng app trước:

```bash
docker compose stop app
```

Với `.env` đã cấu hình ở bước 8.2, chạy tại thư mục gốc:

```bash
npm ci
npm run prisma:generate
npx prisma migrate deploy
npm run dev
```

Mở terminal thứ hai:

```bash
npm ci --prefix client
npm run client:dev
```

Truy cập frontend tại http://localhost:5173 và Swagger tại http://localhost:5000/api-docs.

Nếu dùng MySQL tự cài, tạo database `cinema_booking` cùng tài khoản có quyền phù hợp và điều chỉnh `DATABASE_URL`. Nếu dùng Railway cho backend local, dùng endpoint kết nối công khai của Railway, không dùng hostname chỉ truy cập được trong mạng nội bộ Railway. Chỉ chạy migration trên database mà bạn chủ động muốn cập nhật.

### 8.5. Cấu hình API cho frontend

Khi chạy local bằng Vite, để `VITE_API_URL` không được đặt: frontend mặc định gọi `/api` qua proxy. Nếu có file `client/.env.local` cũ trỏ đến cloud, xóa hoặc điều chỉnh biến này để kiểm thử backend local.

Có thể dùng URL tuyệt đối trong `client/.env.local`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Khởi động lại Vite sau khi đổi biến môi trường. URL phải bao gồm `/api` và không có dấu `/` ở cuối, vì HTTP client nối trực tiếp endpoint vào URL này.

### 8.6. Khởi tạo dữ liệu và tài khoản Admin

Migration tạo cấu trúc cơ sở dữ liệu. Phiên bản hiện tại chưa kèm file seed; dữ liệu demo và tài khoản được khởi tạo qua API theo quy trình dưới đây.

Quy trình dữ liệu local:

1. Đăng ký một tài khoản qua `POST /api/auth/register`.
2. Cấp quyền `ADMIN` cho đúng tài khoản trong database local.
3. Đăng nhập và sử dụng access token để tạo dữ liệu bằng Swagger.
4. Tạo **phim**, **rạp**, **phòng**, **ghế**, rồi mới tạo **suất chiếu**.
5. Đăng ký tài khoản khách hàng riêng và thử luồng đặt vé.

Cấp quyền cho tài khoản local qua MySQL trong Docker:

```bash
docker compose exec mysql mysql -u cbs -p cinema_booking
```

Nhập mật khẩu local được khai báo trong Compose, sau đó chạy SQL, thay email ví dụ bằng tài khoản bạn vừa tạo:

```sql
SELECT id, email, role, status FROM `User`;
UPDATE `User`
SET role = 'ADMIN'
WHERE email = 'admin.local@example.com';
SELECT id, email, role, status
FROM `User`
WHERE email = 'admin.local@example.com';
```

Đăng nhập lại bằng tài khoản này để lấy token có role mới.

**Tạo ghế trước khi tạo suất chiếu:** khi tạo suất chiếu, backend sinh các `ShowtimeSeat` từ ghế đang active trong phòng. Tạo ghế vật lý sau đó không tự bổ sung ghế vào những suất chiếu đã tồn tại.

## 9. Biến môi trường

| Biến | Nơi sử dụng | Ý nghĩa |
| --- | --- | --- |
| `DATABASE_URL` | Backend và Prisma CLI | URL kết nối MySQL; được ưu tiên khi tạo adapter runtime. |
| `SHADOW_DATABASE_URL` | Prisma CLI | Database riêng cho `migrate dev`; không cần với `migrate deploy`. |
| `PORT` | Backend | Cổng HTTP; sử dụng 5000 khi chạy local. |
| `JWT_SECRET` | Backend | Khóa ký/xác minh JWT; cần cấu hình để đăng nhập và gọi API được bảo vệ. |
| `JWT_EXPIRES_IN` | Backend | Thời hạn access token, ví dụ `1h`. |
| `NODE_ENV` | Backend | Môi trường vận hành; một số lỗi ẩn chi tiết khi là `production`. |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Adapter runtime | Cấu hình dự phòng khi không có `DATABASE_URL`; Prisma CLI vẫn cần URL theo config. |
| `VITE_API_URL` | Frontend | Base URL API; mặc định `/api`, dùng proxy trong Vite dev server. |

## 10. API và kiểm thử bằng Swagger

### 10.1. Các endpoint chính

Các endpoint dưới đây dùng tiền tố `/api`, ngoại trừ `/health`.

| Method | Endpoint | Quyền | Mục đích |
| --- | --- | --- | --- |
| GET | `/health` | Public | Kiểm tra HTTP server đang phản hồi. |
| POST | `/api/auth/register` | Public | Đăng ký Customer. |
| POST | `/api/auth/login` | Public | Đăng nhập, trả `data.accessToken`. |
| GET | `/api/auth/me` | Đăng nhập | Thông tin tài khoản. |
| GET | `/api/auth/protected` | Đăng nhập | Thử xác thực JWT. |
| GET | `/api/movies`, `/api/movies/{id}` | Public | Danh sách/chi tiết phim. |
| POST | `/api/movies` | Admin | Tạo phim. |
| PUT / DELETE | `/api/movies/{id}` | Admin | Cập nhật/xóa phim. |
| GET | `/api/cinemas`, `/api/cinemas/{id}` | Public | Danh sách/chi tiết rạp. |
| POST | `/api/cinemas` | Admin | Tạo rạp. |
| PUT / DELETE | `/api/cinemas/{id}` | Admin | Cập nhật/xóa rạp. |
| GET | `/api/rooms`, `/api/rooms/{id}` | Admin | Danh sách/chi tiết phòng. |
| POST | `/api/rooms` | Admin | Tạo phòng. |
| PUT / DELETE | `/api/rooms/{id}` | Admin | Cập nhật/xóa phòng. |
| GET | `/api/seats`, `/api/seats/{id}` | Admin | Danh sách/chi tiết ghế vật lý. |
| POST | `/api/seats` | Admin | Tạo ghế vật lý. |
| PUT / DELETE | `/api/seats/{id}` | Admin | Cập nhật/xóa ghế. |
| GET | `/api/showtimes`, `/api/showtimes/{id}` | Public | Danh sách/chi tiết suất chiếu. |
| GET | `/api/showtimes/{id}/seats` | Public | Sơ đồ ghế và trạng thái theo suất chiếu. |
| POST | `/api/showtimes` | Admin | Tạo suất chiếu. |
| PUT / DELETE | `/api/showtimes/{id}` | Admin | Cập nhật/xóa suất chiếu. |
| POST | `/api/bookings/hold` | Đăng nhập | Giữ ghế theo thời hạn. |
| POST | `/api/bookings/release` | Đăng nhập | Nhả các ghế do tài khoản hiện tại giữ. |
| POST | `/api/bookings` | Đăng nhập | Tạo booking và vé. |
| GET | `/api/bookings/my-bookings` | Đăng nhập | Danh sách booking cá nhân. |
| GET | `/api/bookings/{id}` | Chủ booking hoặc Admin | Chi tiết booking. |
| POST | `/api/bookings/{id}/cancel` | Chủ booking hoặc Admin | Hủy booking theo điều kiện. |
| GET | `/api/bookings` | Admin | Danh sách booking toàn hệ thống. |

`/api/cinema` được mount như alias của `/api/cinemas`; nên dùng đường dẫn số nhiều để thống nhất với frontend. Các bản ghi được định danh bằng UUID.

Ví dụ query:

```text
/api/showtimes?movieId=<UUID>&cinemaId=<UUID>&date=YYYY-MM-DD
/api/seats?roomId=<UUID>&active=true
/api/bookings?status=CONFIRMED
```

Bộ lọc `date` của API suất chiếu sử dụng ngày **UTC**.

### 10.2. Đăng nhập và Authorize

1. Mở Swagger local hoặc link triển khai ở đầu README. Chọn server phù hợp; với cloud có thể chọn “Máy chủ hiện tại”.
2. Gọi `POST /api/auth/register` nếu chưa có tài khoản. Họ tên tối thiểu 2 ký tự, mật khẩu tối thiểu 8 ký tự, số điện thoại gồm 9–11 chữ số.
3. Gọi `POST /api/auth/login` với email và mật khẩu.
4. Sao chép **`data.accessToken`** trong response.
5. Nhấn **Authorize**, dán token vào `BearerAuth`. Với Swagger HTTP bearer, chỉ cần dán token, không cần thêm `Bearer `.
6. Thử `GET /api/auth/me`, sau đó thử các API phù hợp với quyền tài khoản.

Với Postman/cURL/HTTP client, header là `Authorization: Bearer <accessToken>`. Đăng ký công khai không tạo Admin; dùng hướng dẫn cấp quyền local ở mục 8.6 hoặc tài khoản do nhóm quản lý cấp cho môi trường demo.

### 10.3. Ví dụ request

**Đăng ký — `POST /api/auth/register`**

```json
{
  "fullName": "Khách hàng thử nghiệm",
  "email": "customer.local@example.com",
  "phone": "0900000001",
  "password": "LocalDemo123!"
}
```

Sử dụng dữ liệu trên để tạo tài khoản thử nghiệm ở môi trường local.

**Giữ ghế — `POST /api/bookings/hold`**

```json
{
  "showtimeId": "<UUID_SUAT_CHIEU>",
  "showtimeSeatIds": ["<UUID_GHE_CUA_SUAT_CHIEU>"],
  "durationMinutes": 10
}
```

**Tạo booking — `POST /api/bookings`**

```json
{
  "showtimeId": "<UUID_SUAT_CHIEU>",
  "showtimeSeatIds": ["<UUID_GHE_CUA_SUAT_CHIEU>"]
}
```

Thay các placeholder bằng ID thực tế. Lấy `showtimeSeatIds` từ trường `id` trong kết quả `GET /api/showtimes/{id}/seats`.

Response thành công thường có `success: true` và `data`; lỗi thường có `success: false`, `message` và có thể có `errors`. Đọc schema từng endpoint trong Swagger để biết đầy đủ cấu trúc.

| HTTP status | Ý nghĩa thường gặp |
| --- | --- |
| 200 / 201 | Xử lý thành công / tạo tài nguyên thành công. |
| 400 | Dữ liệu đầu vào không hợp lệ. |
| 401 | Thiếu token, token sai/hết hạn hoặc thông tin đăng nhập sai. |
| 403 | Không có quyền, tài khoản bị chặn hoặc booking không thuộc người dùng. |
| 404 | Tài nguyên không tồn tại. |
| 409 | Xung đột dữ liệu hoặc điều kiện nghiệp vụ, như ghế đã đặt/đang giữ. |
| 500 | Lỗi xử lý ngoài các trường hợp đã được ánh xạ. |
| 503 | Middleware xác thực không truy cập được database. |

## 11. Kiểm tra build và kiểm thử chức năng

### 11.1. Kiểm tra mã nguồn

Sau khi cài dependencies và cấu hình `.env`, chạy tại thư mục gốc:

```bash
npm run prisma:generate
npm run typecheck
npm run build
npm run client:build
npm run lint --prefix client
```

Build backend tạo `dist/`; chạy bản đã biên dịch bằng `npm start`. `npm run dev` dùng `tsx watch` và tự tải lại khi sửa code backend. Docker Compose hiện chạy bản biên dịch, không tự reload `src/`; sau thay đổi cần rebuild app:

```bash
docker compose up -d --build app
```

### 11.2. Kịch bản kiểm thử chức năng

| Nhóm | Trường hợp cần kiểm tra | Kết quả cần đối chiếu |
| --- | --- | --- |
| Auth | Đăng ký hợp lệ, email/phone trùng, mật khẩu ngắn, đăng nhập sai. | Dữ liệu hợp lệ được tạo; lỗi trả đúng status và không tạo bản ghi sai. |
| Phân quyền | Không token, token hết hạn, Customer gọi API Admin, tài khoản BLOCKED. | Request trái quyền bị từ chối. |
| Movie/Cinema/Room | CRUD, UUID sai, dữ liệu thiếu, tham chiếu không tồn tại, xóa bản ghi có liên kết. | API và database giữ quan hệ hợp lệ; lỗi phản ánh đúng nguyên nhân. |
| Seat | Vị trí trùng, quá sức chứa, ghế inactive. | Không tạo ghế sai; ghế inactive không được đặt. |
| Showtime | Lịch chồng lấn, khoảng thời gian sai, tạo sau khi phòng có ghế. | Lịch hợp lệ và ShowtimeSeat được sinh đúng. |
| Hold | Giữ, nhả, hết hạn, hai tài khoản giữ cùng ghế. | Quyền giữ và thời hạn nhất quán giữa API và database. |
| Booking | Đặt hợp lệ, ghế trùng trong request, quá 8 ghế, ghế đã đặt, suất chiếu đã bắt đầu. | Tổng tiền, ghế và vé nhất quán; request sai không tạo booking dở dang. |
| Ownership/Cancel | Xem/hủy booking người khác, hủy lặp, hủy trước/sau giờ chiếu. | Bảo vệ quyền sở hữu; giải phóng ghế đúng và không làm sai booking mới. |
| Frontend | Đăng nhập → chọn phim → chọn suất → chọn ghế → xác nhận → vé cá nhân. | Giao diện phản ánh dữ liệu thật và xử lý lỗi API. |

Bảng trên xác định phạm vi kiểm thử chức năng dự kiến. Kết quả kiểm thử tải và tranh chấp giữ ghế đã ghi nhận được trình bày tại mục 12.

## 12. Kiểm thử tải và tranh chấp ghế

### 12.1. Môi trường và phương pháp

Kết quả được tổng hợp từ notebook `test-load-cinema-booking-system (1).ipynb`, sử dụng Python để kiểm thử REST API đã triển khai trên Render.

| Thành phần | Thông tin |
| --- | --- |
| API đích | `https://cinema-booking-system-esvw.onrender.com/api` |
| Công cụ gửi tải | Python, `asyncio`, `aiohttp` |
| Tổng hợp số liệu | pandas, NumPy |
| Biểu đồ | Matplotlib, Seaborn |
| Phạm vi | Đọc phim/rạp, đọc sơ đồ ghế, đăng nhập và tranh chấp giữ ghế |

Các bài kiểm thử gửi một tập request với giới hạn tác vụ đồng thời. HTTP 200 được ghi nhận là thành công trong các bài tải đọc và đăng nhập.

### 12.2. Kết quả kiểm thử tải

| Kịch bản | Request | Giới hạn tác vụ đồng thời | Thời gian chạy | HTTP 200 | Lượt không thành công | Throughput¹ | P95² |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Đọc phim và rạp | 2.000 GET, 1.000 mỗi endpoint | 100 | 18,73 s | 2.000 | 0 | 106,78 req/s | 1.301,32 ms |
| Đọc ghế của một suất chiếu | 1.000 GET | 150 | 69,54 s | 999 | 1 | 14,4 req/s | 11.690,6 ms |
| Đăng nhập cùng một tài khoản | 150 POST | 50 | 62,79 s | 0 | 150 | 2,4 req/s | 20.995,8 ms |

¹ Throughput tính trên toàn bộ lượt thử, bao gồm lượt thất bại. Giới hạn tác vụ đồng thời sử dụng semaphore; số kết nối HTTP thực tế còn phụ thuộc connection pool.

² Thời gian được ghi nhận đến khi nhận response headers, bao gồm lượt thất bại. P95 đăng nhập trong bảng không phải độ trễ của các lần đăng nhập thành công.

Lượt kiểm thử đọc phim và rạp ghi nhận 100% phản hồi HTTP 200. API sơ đồ ghế đạt tỷ lệ thành công 99,9%, nhưng thời gian phản hồi còn cao. Bài đăng nhập không ghi nhận phản hồi HTTP 200 và là hạng mục ưu tiên điều tra trong giai đoạn tiếp theo.

Các số liệu phản ánh những lượt kiểm thử đã lưu, phục vụ so sánh hiệu năng và xác định khu vực cần tối ưu.

### 12.3. Tranh chấp giữ ghế

Kịch bản sử dụng **20 tài khoản độc lập**, đồng thời gọi `POST /api/bookings/hold` để giữ cùng một ghế còn trống của suất chiếu trong tương lai.

| Kết quả | Số request |
| --- | ---: |
| Giữ ghế thành công, HTTP 200/201 | 1 |
| Xung đột giữ ghế, HTTP 409 | 19 |
| Phản hồi hoặc ngoại lệ khác | 0 |

Kết quả ghi nhận một tài khoản giữ được ghế và các tài khoản còn lại nhận phản hồi xung đột. Phạm vi bài kiểm thử là thao tác giữ ghế. Kiểm thử đồng thời toàn bộ luồng tạo, hủy và đặt lại booking thuộc kế hoạch giai đoạn 2.

## 13. Triển khai và vận hành

### Frontend

Frontend đặt tại `client/` và có cấu hình SPA rewrite trong `client/vercel.json`. Khi triển khai, đặt:

```dotenv
VITE_API_URL=https://cinema-booking-system-esvw.onrender.com/api
```

Build frontend bằng `npm run client:build` từ thư mục gốc, hoặc `npm run build` trong `client/`. Kết quả ở `client/dist/`. Các biến `VITE_*` được nhúng vào frontend khi build; đổi URL cần build/triển khai lại.

### Backend và database

Backend triển khai trên Render, dùng MySQL trên Railway theo cấu hình môi trường của nhóm. Cần đặt `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN` và sử dụng cổng do môi trường cung cấp qua `PORT`.

Các bước cơ bản khi triển khai bằng Node:

```bash
npm ci
npm run build
npx prisma migrate deploy
npm start
```

Chạy migration trên database đúng môi trường trước khi phục vụ request. Không dùng `migrate dev` như bước triển khai production. Build backend có `prebuild` để generate Prisma Client.

### Các kiểm tra vận hành

```bash
docker compose ps
docker compose logs -f app
docker compose logs -f mysql
```

`GET /health` kiểm tra trạng thái HTTP server. Để kiểm tra kết nối database, gọi thêm một endpoint truy vấn dữ liệu hoặc kiểm tra trạng thái migration.

| Triệu chứng | Hướng kiểm tra |
| --- | --- |
| Frontend không gọi được API | Kiểm tra backend cổng 5000, proxy Vite và `VITE_API_URL`; khởi động lại Vite khi đổi env. |
| API trả 500/503 | Xem log backend, `DATABASE_URL`, quyền kết nối và schema database. |
| Movie hoạt động nhưng Cinema/Room lỗi | Kiểm tra migration và các bảng thực tế `cinemas`, `rooms`; không chỉ tìm tên `Cinema`/`Room`. |
| Thiếu bảng sau khi chạy migration | Kiểm tra database đích, lịch sử migration và các bảng thực tế. |
| Không có phim/suất chiếu/ghế | Migration không tạo dữ liệu mẫu; tạo dữ liệu đúng thứ tự ở mục 8.6. |
| 403 ở Room/Seat | Những API quản lý này, kể cả GET, đang yêu cầu Admin. |
| 409 khi đặt vé | Kiểm tra trạng thái ghế, hold, suất chiếu đã bắt đầu hoặc không còn SCHEDULED. |
| Đổi code nhưng Docker vẫn chạy bản cũ | Rebuild app; Compose hiện không bind-mount source để hot reload. |
| Cổng 3306/5000 bị chiếm | Dừng dịch vụ xung đột hoặc đổi port mapping cùng các URL cấu hình liên quan. |
| Đăng nhập thiếu JWT secret | Cấu hình `JWT_SECRET` và khởi động lại backend. |

## 14. Phạm vi hoàn thiện và hướng phát triển

### Phạm vi cần hoàn thiện

- Thanh toán hiện mô phỏng bước xác nhận booking; tích hợp cổng thanh toán và hoàn tiền sẽ được phát triển ở giai đoạn sau.
- Quản trị dữ liệu hiện thực hiện qua API. Dashboard quản trị frontend và đăng nhập Google OAuth chưa được triển khai hoàn chỉnh.
- Trạng thái ghế cập nhật bằng polling; tác vụ nền tự động giải phóng hold hết hạn thuộc kế hoạch giai đoạn 2.
- Ghế bổ sung sau khi tạo suất chiếu chưa tự đồng bộ vào suất chiếu đã tồn tại.
- Vé cung cấp thông tin đặt chỗ và mã vé; tích hợp thiết bị soát vé chưa nằm trong phạm vi phiên bản hiện tại.

### Định hướng giai đoạn 2

Giai đoạn 2 tập trung cải thiện các thuộc tính chất lượng dựa trên kết quả kiểm thử và nhu cầu hoàn thiện luồng đặt vé:

| Thuộc tính chất lượng | Công việc dự kiến | Cách đánh giá |
| --- | --- | --- |
| **Tính nhất quán và toàn vẹn dữ liệu** | Hoàn thiện transaction giữ/đặt/hủy ghế; bổ sung idempotency để tránh tạo booking trùng khi gửi lại request. | Nhiều tài khoản cùng đặt một ghế, hủy lặp và hủy đồng thời với đặt lại; đối chiếu booking, vé và trạng thái ghế trong database. |
| **Hiệu năng** | Điều tra lỗi đăng nhập dưới tải; tối ưu truy vấn sơ đồ ghế, dữ liệu trả về, index và connection pool dựa trên phép đo. | So sánh throughput thành công, P95/P99 và tỷ lệ lỗi trước/sau trên cùng môi trường, dữ liệu và mức tải. |
| **Độ tin cậy và khả năng phục hồi** | Bổ sung worker giải phóng hold hết hạn; bảo đảm không giải phóng ghế vừa được gia hạn hoặc đặt thành công. | Kiểm thử hết hạn, bỏ dở thao tác, khởi động lại backend và tranh chấp với worker. |
| **Khả năng mở rộng** | Thử Redis cho dữ liệu phim/rạp để giảm tải đọc database; có TTL, xóa cache khi cập nhật và fallback về MySQL. MySQL tiếp tục quyết định quyền sở hữu ghế. | Tăng dần tải, đo cache hit rate, throughput và độ trễ; kiểm tra dữ liệu sau cập nhật hoặc khi Redis lỗi. |
| **Khả năng bảo trì và kiểm thử** | Chuẩn hóa xử lý lỗi, ranh giới Service/Repository và bổ sung kiểm thử tự động cho nghiệp vụ quan trọng. | Chạy test nghiệp vụ/API, typecheck/build và đánh giá phạm vi ảnh hưởng khi thay đổi quy tắc đặt vé. |
| **Khả năng quan sát** | Bổ sung request ID, log có cấu trúc, số liệu thời gian xử lý và readiness kiểm tra database. | Truy vết request lỗi qua log, phân biệt lỗi nghiệp vụ với lỗi hệ thống và xác nhận hành vi khi database/migration gặp lỗi. |
| **Tính dễ sử dụng** | Hoàn thiện giao diện quản trị và nghiên cứu SSE/WebSocket để cập nhật trạng thái ghế, kèm xử lý mất kết nối. | Kiểm thử xuyên suốt các thao tác quản trị/đặt vé; đo độ trễ cập nhật ghế và kiểm tra giao diện sau khi kết nối lại. |
| **Khả năng tương tác và bảo mật** | Tích hợp cổng thanh toán sandbox, xác minh callback và xử lý thông báo thanh toán lặp. | Kiểm thử callback hợp lệ, giả mạo, lặp, thất bại và đến muộn; đối chiếu trạng thái thanh toán với booking. |
