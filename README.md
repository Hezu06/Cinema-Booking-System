# Cinema Booking System — Sọt phim

Hệ thống đặt vé xem phim của **Nhóm 8**, gồm giao diện khách hàng bằng React và backend REST API bằng Node.js/Express. Khách hàng có thể tra cứu phim, chọn suất chiếu, chọn và giữ ghế, xác nhận đặt vé và quản lý booking cá nhân. Quản trị viên quản lý dữ liệu rạp chiếu thông qua các API được phân quyền.

| Tài nguyên | Đường dẫn |
| --- | --- |
| Giao diện triển khai | [cbs-project8.vercel.app](https://cbs-project8.vercel.app/) |
| Swagger UI triển khai | [Tài liệu Cinema Booking System API](https://cinema-booking-system-esvw.onrender.com/api-docs) |
| Backend triển khai | https://cinema-booking-system-esvw.onrender.com |
| Tài liệu đặc tả | [CBS Docs](https://docs.google.com/document/d/1B_aNnkKWiQXstp545iEiL28QV7SFEieEPcsvvMGbnbI/edit?usp=drivesdk) |

## Mục lục

1. [Thông tin nhóm](#1-thông-tin-nhóm)
2. [Mục tiêu và phạm vi](#2-mục-tiêu-và-phạm-vi)
3. [Chức năng và use case](#3-chức-năng-và-use-case)
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
14. [Giới hạn và hướng phát triển](#14-giới-hạn-và-hướng-phát-triển)

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

Phân công công việc cụ thể của từng thành viên cần được nhóm bổ sung.

## 2. Mục tiêu và phạm vi

### Mục tiêu

- Cung cấp hành trình đặt vé từ tra cứu phim đến nhận thông tin booking và vé.
- Quản lý tập trung phim, rạp, phòng, ghế và suất chiếu.
- Tổ chức backend theo các tầng API, Business và Data Access để phân chia trách nhiệm và thuận tiện bảo trì.
- Xác thực bằng JWT, phân quyền `CUSTOMER`/`ADMIN` và kiểm tra quyền sở hữu booking.
- Xử lý trạng thái ghế theo từng suất chiếu, sử dụng transaction và cập nhật có điều kiện khi giữ hoặc đặt ghế.
- Cung cấp Swagger UI để mô tả và thử nghiệm API.

### Phạm vi hiện tại

Mã nguồn đã có frontend khách hàng và backend cho Auth, Movie, Cinema, Room, Seat, Showtime, Booking. Dữ liệu Ticket được tạo trong luồng Booking; hiện chưa có router `/api/tickets` độc lập.

Phiên bản hiện tại có cơ chế giữ ghế theo thời hạn. Giao diện thanh toán cung cấp lựa chọn phương thức, nhưng thao tác hoàn tất gọi API tạo booking. Hệ thống chưa xử lý giao dịch tiền thật qua ngân hàng hoặc ví điện tử, chưa có hoàn tiền tự động và chưa tích hợp thiết bị soát vé.

## 3. Chức năng và use case

### Khách hàng

| Use case | Chức năng | Cách hoạt động |
| --- | --- | --- |
| UC-01 | Đăng ký | Kiểm tra thông tin và tạo tài khoản mặc định có quyền `CUSTOMER`. |
| UC-02 | Đăng nhập | Xác thực email/mật khẩu và trả JWT access token. |
| UC-03 | Xem danh sách phim | Lấy phim từ API và hiển thị trên giao diện khách hàng. |
| UC-04 | Xem chi tiết phim | Xem mô tả, thể loại, thời lượng, ngày phát hành và poster. |
| UC-05 | Xem suất chiếu | Tra cứu theo phim, rạp, phòng, ngày và trạng thái. |
| UC-06 | Xem ghế theo suất chiếu | Lấy sơ đồ ghế và trạng thái `AVAILABLE`, `HELD`, `BOOKED`. |
| UC-07 | Đặt vé | Kiểm tra suất chiếu và ghế, tạo booking cùng các vé tương ứng. |
| UC-08 | Xem booking cá nhân | Xem danh sách và chi tiết booking thuộc tài khoản đang đăng nhập. |
| UC-09 | Hủy booking | Kiểm tra quyền, thời điểm suất chiếu và trạng thái; hủy vé và giải phóng ghế. |

Ngoài các use case cốt lõi, phiên bản hiện tại cung cấp API giữ/nhả ghế, thông tin tài khoản và giao diện đếm ngược thời hạn giữ chỗ. Trang chọn ghế cập nhật trạng thái bằng polling khoảng **3,5 giây** khi tab đang hiển thị; hệ thống chưa sử dụng WebSocket để đẩy trạng thái tức thời.

### Quản trị viên

| Use case | Chức năng | Cách hoạt động |
| --- | --- | --- |
| UC-10 | Quản lý phim | Thêm, cập nhật và xóa dữ liệu phim qua API. |
| UC-11 | Quản lý rạp | Quản lý tên, địa chỉ và thành phố của rạp. |
| UC-12 | Quản lý phòng | Quản lý phòng thuộc rạp, loại phòng và sức chứa. |
| UC-13 | Quản lý ghế | Quản lý vị trí, loại ghế và trạng thái hoạt động của ghế vật lý. |
| UC-14 | Quản lý suất chiếu | Tạo/cập nhật/xóa lịch chiếu, kiểm tra tham chiếu và lịch chồng lấn. |
| Bổ sung | Xem toàn bộ booking | Tra cứu booking trên hệ thống với quyền `ADMIN`. |

Các thao tác quản trị được thực hiện qua REST API, có thể minh họa bằng Swagger. Frontend hiện chưa có dashboard quản trị hoàn chỉnh.

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

Controller là nơi kiểm tra Zod và ánh xạ lỗi nghiệp vụ sang HTTP trong mã nguồn hiện tại. 

Service không nhận `Request`/`Response` của Express. Các transaction giữ/đặt/hủy ghế hiện được đặt trong Booking Repository và bao gồm một phần kiểm tra nghiệp vụ liên quan đến dữ liệu. Vì vậy, ranh giới phân tầng là cơ sở thiết kế, không có nghĩa là Clean Architecture được tuân thủ tuyệt đối ở mọi module.

### Luồng đặt vé

1. Frontend lấy phim, suất chiếu và các `ShowtimeSeat` của suất chiếu.
2. Khách hàng đăng nhập, chọn ghế và gọi API giữ ghế khi tiếp tục sang bước xác nhận.
3. Controller kiểm tra request; middleware xác thực tài khoản; Service kiểm tra danh sách ghế.
4. Repository kiểm tra suất chiếu và trạng thái ghế, cập nhật ghế có điều kiện trong transaction.
5. Backend tạo `Booking`, `BookingSeat`, `Ticket`, tính tổng tiền từ giá ghế trong database rồi trả chi tiết booking.
6. Frontend chuyển sang màn hình kết quả và cho phép xem vé trong tài khoản cá nhân.

## 6. Mô hình dữ liệu và nghiệp vụ

### Các thực thể hiện có

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

`Payment` chưa có trong schema hiện tại.

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

Một `ShowtimeSeat` có thể xuất hiện trong nhiều bản ghi `BookingSeat` lịch sử sau khi booking cũ bị hủy và ghế được đặt lại. Điều này khác với việc cho phép nhiều booking còn hiệu lực cùng chiếm một ghế.

### Quy tắc đang triển khai

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

**Cơ chế hết hạn giữ ghế:** API đọc sơ đồ ghế giải phóng các hold hết hạn của suất chiếu; các thao tác giữ/đặt cũng xử lý điều kiện hold hết hạn. Chưa có tác vụ nền chạy riêng để quét toàn bộ hold.

**Cơ chế tranh chấp:** giữ/đặt ghế sử dụng transaction, cập nhật có điều kiện và kiểm tra số bản ghi cập nhật. Khả năng xử lý dưới tải và các cuộc đua giữa đặt/hủy cần được xác nhận bằng kiểm thử đồng thời; ràng buộc unique trong schema không tự chứng minh toàn bộ luồng không đặt trùng.

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
- **Node.js 22.12 trở lên trong dòng 22 LTS**, cùng npm, để chạy frontend hoặc backend trực tiếp. Mốc này phù hợp với yêu cầu Node của Prisma/Vite trong lockfile hiện tại.
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

Dán kết quả vào `JWT_SECRET`. Nếu chưa tạo migration mới, có thể xóa dòng `SHADOW_DATABASE_URL` khỏi `.env`: chạy các migration đã có bằng `migrate deploy` không cần shadow database.

> `.env.example` hiện đặt `PORT=3000`, trong khi `client/vite.config.ts` proxy đến `localhost:5000`. README này thống nhất dùng **5000**. Docker Compose cũng cố định app ở cổng 5000.

### 8.3. Cách A — Backend và MySQL bằng Docker

Tại thư mục gốc:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

Container MySQL được kiểm tra health trước khi app khởi động. Entrypoint gọi `prisma migrate deploy`; cần xem log để xác nhận migration thành công. Nhấn `Ctrl+C` để thoát xem log, container vẫn chạy.

Kiểm tra trạng thái migration khi cần:

```bash
docker compose exec app npx prisma migrate status
```

Các URL backend:

- Health: http://localhost:5000/health
- Swagger: http://localhost:5000/api-docs
- REST API: http://localhost:5000/api

Docker Compose hiện chỉ chạy **MySQL và backend**, chưa chạy frontend. Mở terminal thứ hai tại thư mục gốc:

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

Docker Compose khai báo chuỗi kết nối MySQL của app đến hostname `mysql`. Sửa riêng `DATABASE_URL` trong `.env` sẽ không chuyển app container sang Railway, vì giá trị này đang được ghi trực tiếp trong `docker-compose.yml`.

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

Khởi động lại Vite sau khi đổi biến môi trường. URL phải có tiền tố `/api` và nên không có dấu `/` ở cuối, vì HTTP client nối trực tiếp endpoint vào URL này.

### 8.6. Khởi tạo dữ liệu và tài khoản Admin

Migration chỉ tạo/cập nhật schema; **không tự tạo phim, rạp, ghế, suất chiếu hoặc tài khoản demo**. Bản hiện tại chưa có file seed, nên chưa chạy được `npm run prisma:seed`.

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

Đăng nhập lại bằng tài khoản này để lấy token có role mới. Không chỉnh chuỗi JWT để tự cấp quyền.

**Tạo ghế trước khi tạo suất chiếu:** khi tạo suất chiếu, backend sinh các `ShowtimeSeat` từ ghế đang active trong phòng. Tạo ghế vật lý sau đó không tự bổ sung ghế vào những suất chiếu đã tồn tại.

## 9. Biến môi trường

| Biến | Nơi sử dụng | Ý nghĩa |
| --- | --- | --- |
| `DATABASE_URL` | Backend và Prisma CLI | URL kết nối MySQL; được ưu tiên khi tạo adapter runtime. |
| `SHADOW_DATABASE_URL` | Prisma CLI | Database riêng cho `migrate dev`; không cần với `migrate deploy`. |
| `PORT` | Backend | Cổng HTTP; README dùng 5000 để khớp proxy frontend. |
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

Filter `date` của suất chiếu hiện được backend diễn giải thành khoảng ngày **UTC**. Cần kiểm tra thời gian hiển thị khi dữ liệu/giao diện dùng giờ Việt Nam.

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

Đây là dữ liệu ví dụ local; không phải tài khoản có sẵn trên cloud.

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

Thay các placeholder bằng ID thực tế. Nên dùng `id` của bản ghi trong `GET /api/showtimes/{id}/seats` để gửi `showtimeSeatIds`; không tự đoán ID. API cũng hỗ trợ ID ghế vật lý trong logic Repository hiện tại, nhưng dùng ShowtimeSeat ID giúp thể hiện đúng ngữ cảnh suất chiếu.

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

Typecheck/build/lint giúp phát hiện lỗi mã nguồn, không thay thế kiểm thử nghiệp vụ hoặc kiểm thử API. README không khẳng định các lệnh đã thành công trên mọi môi trường.

### 11.2. Checklist chức năng đề xuất

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

Bản mã nguồn hiện tại chưa kèm bộ unit/integration test. Script `test:concurrency` trỏ đến file chưa có; chỉ chạy sau khi bổ sung file tương ứng. Nhóm đã cung cấp notebook Python kiểm thử tải riêng, với kịch bản và output được trình bày ở mục 12; notebook này chưa nằm trong ZIP mã nguồn. Kết quả kiểm thử cần ghi cùng phiên bản mã nguồn và môi trường thực hiện.

## 12. Kiểm thử tải và tranh chấp ghế

### 12.1. Nguồn kết quả và phương pháp

Nhóm cung cấp notebook **`test-load-cinema-booking-system (1).ipynb`** với mã kiểm thử và output đã lưu. Các số liệu dưới đây được trích từ output của notebook, không phải kết quả chạy lại trong quá trình biên soạn README.

| Thành phần | Thông tin |
| --- | --- |
| API đích | `https://cinema-booking-system-esvw.onrender.com/api` |
| Công cụ gửi tải | Python, `asyncio`, `aiohttp` |
| Tổng hợp số liệu | pandas, NumPy |
| Biểu đồ | Matplotlib, Seaborn |
| Kiểu chạy | Gửi một tập request hữu hạn bằng `asyncio.gather`, giới hạn đồng thời bằng semaphore/connection pool. |
| Tiêu chí tải đọc/đăng nhập | HTTP 200 được tính là thành công. |
| Tiêu chí tranh chấp hold | HTTP 200/201 là giữ thành công; HTTP 409 là xung đột dự kiến. |
| Thông tin còn thiếu | Thời điểm chạy từng bài, commit backend, cấu hình máy phát tải và tài nguyên backend/database. |

Notebook không lưu thông tin đủ để xác nhận cấu hình Kaggle/máy phát tải cụ thể. Các bài tải không có bước ramp-up, thời lượng tải ổn định hoặc soak test riêng. Đây là số liệu của các lượt chạy cụ thể, chưa phải giới hạn tải tối đa của hệ thống.

### 12.2. Kịch bản và kết quả tải

| Kịch bản | Request | Cấu hình đồng thời | Thời gian | HTTP 200 | Không trả HTTP 200/ngoại lệ | Throughput toàn bộ lượt thử | P95 |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Đọc phim và rạp | 2.000 GET, luân phiên `/movies` và `/cinemas` (1.000 mỗi endpoint) | Semaphore 100; connector 100 | 18,73 s | 2.000 (100%) | 0 (0%) | 106,78 req/s | 1.301,32 ms |
| Đọc ghế theo suất chiếu | 1.000 GET `/showtimes/{id}/seats`, cùng một suất chiếu | Semaphore 150; session dùng connector mặc định | 69,54 s | 999 (99,9%) | 1 (0,1%) | 14,4 req/s | 11.690,6 ms |
| Đăng nhập | 150 POST `/auth/login`, dùng cùng một tài khoản demo | Semaphore **50**; session dùng connector mặc định | 62,79 s | 0 (0%) | 150 (100%) | 2,4 req/s | 20.995,8 ms |

**Cách hiểu mức đồng thời:** output của notebook ghi đăng nhập “150 reqs đồng thời”, nhưng code giới hạn tối đa **50 tác vụ** qua semaphore. Với bài sơ đồ ghế, semaphore là 150 nhưng không cấu hình `TCPConnector(limit=150)`; connector mặc định của aiohttp giới hạn tổng kết nối ở 100. Vì vậy mô tả này không có nghĩa là lượt chạy này đã có 150 kết nối HTTP hoạt động đồng thời.

**Throughput:** notebook tính tổng số lượt thử chia thời gian chạy, bao gồm cả lượt lỗi. Con số 2,4 req/s của đăng nhập không phải throughput đăng nhập thành công; bài này không ghi nhận HTTP 200 nào.

Chi tiết độ trễ tải đọc phim/rạp:

| Chỉ số | Giá trị |
| --- | ---: |
| P50 | 908,49 ms |
| P90 | 1.291,49 ms |
| P95 | 1.301,32 ms |
| P99 | 1.395,37 ms |
| Min | 294,37 ms |
| Max | 1.707,86 ms |

Các chỉ số bổ sung:

- Sơ đồ ghế: Max **15.301,9 ms**, timeout cấu hình **15 giây**.
- Đăng nhập: P50 **20.985,2 ms**, Max **20.996,8 ms**, timeout cấu hình **20 giây**.
- Tải đọc phim/rạp: timeout cấu hình **10 giây**.

**Diễn giải kết quả:** bài đọc phim/rạp có 100% phản hồi HTTP 200 trong lượt chạy được lưu. Bài sơ đồ ghế có P95 khoảng 11,69 giây và một lượt không thành công. Bài đăng nhập có 100% lượt không trả HTTP 200; độ trễ gần/vượt ngưỡng timeout là dấu hiệu cần điều tra. Output chưa lưu phân bố status/loại ngoại lệ chi tiết, nên chưa thể kết luận tất cả lỗi là timeout hoặc khẳng định bcrypt/CPU là nguyên nhân duy nhất. Cần đối chiếu log, CPU, truy vấn và kết nối database.

### 12.3. Tranh chấp giữ cùng một ghế giữa 20 tài khoản

Kịch bản trong notebook:

1. Đăng nhập hoặc đăng ký **20 tài khoản độc lập**, lấy 20 token riêng.
2. Chọn một suất chiếu trong tương lai và một `ShowtimeSeat` có trạng thái `AVAILABLE`.
3. Gửi 20 request `POST /bookings/hold` bằng `asyncio.gather`, cùng suất chiếu và cùng ghế, mỗi request dùng token của một tài khoản.
4. Tổng hợp status của request giữ ghế.
5. Gửi yêu cầu `/bookings/release` cho các tài khoản để dọn dữ liệu giữ ghế.

| Kết quả đã lưu | Số lượng |
| --- | ---: |
| Tài khoản/request tranh chấp | 20 |
| Giữ ghế thành công (HTTP 200/201) | 1 |
| Bị từ chối do xung đột (HTTP 409) | 19 |
| Phản hồi/ngoại lệ khác | 0 |

**Kết luận trong phạm vi bài test:** lượt chạy ghi nhận đúng một tài khoản giữ được ghế và 19 tài khoản nhận phản hồi xung đột, phù hợp kỳ vọng của kịch bản tranh chấp hold.

Notebook có câu kết luận “an toàn tuyệt đối chống double-booking”, nhưng dữ liệu này chưa chứng minh điều đó: kịch bản gọi `/bookings/hold`, không gọi API tạo booking, không kiểm tra hủy/đặt lại đồng thời và không đối chiếu database sau test. Code có gửi request nhả ghế, nhưng không kiểm tra response của từng lần nhả, nên dòng thông báo dọn dẹp không tự xác nhận ghế đã được giải phóng thành công.

### 12.4. Giới hạn của phép đo và biểu đồ

- Tải đọc/đăng nhập đo từ trước khi gọi HTTP đến lúc nhận được response headers; chưa đọc hết hoặc kiểm tra nội dung JSON. Các số liệu này chưa đại diện cho thời gian tải/hiển thị toàn bộ response trên trình duyệt.
- Với bài sơ đồ ghế, thời gian đo có thể bao gồm chờ connection pool vì semaphore lớn hơn giới hạn connector.
- Tỷ lệ lỗi được tính bằng status khác 200 hoặc ngoại lệ. Output không xuất bảng phân bố mã lỗi, nên không phân biệt được toàn bộ lỗi HTTP, kết nối và timeout.
- Bài tranh chấp đọc JSON để lấy thông báo, nhưng số đo latency được lấy trước lúc đọc JSON xong; ngoại lệ trong hàm này còn được ghi latency bằng 0.
- Thống kê latency của các bài tải bao gồm cả lượt thất bại. Không diễn giải P95 đăng nhập là độ trễ của những lần đăng nhập thành công.
- Số liệu phim/rạp được gộp; notebook chưa báo latency riêng từng endpoint.
- Chú thích “JOIN 5 bảng” trong notebook chưa được chứng minh bằng log SQL hoặc execution plan, nên không dùng như mô tả truy vấn thực tế.
- Hai biểu đồ so sánh RPS/P95 dùng số liệu viết trực tiếp trong code, không tự tính từ toàn bộ DataFrame; nhãn đọc nhẹ ghi `/movies` nhưng bài đọc thực tế gồm cả phim và rạp. Bảng kết quả ở trên phản ánh output đầy đủ hơn.
- Mỗi kịch bản có một output được lưu, chưa có thống kê nhiều lượt chạy hoặc phân tích tài nguyên server. Thứ tự cell trong notebook không đồng nghĩa thứ tự thực thi.

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

`GET /health` hiện chỉ xác nhận HTTP server hoạt động, **không kiểm tra kết nối database**. Cần gọi thêm endpoint có truy vấn dữ liệu hoặc kiểm tra migration để đánh giá database.

| Triệu chứng | Hướng kiểm tra |
| --- | --- |
| Frontend không gọi được API | Kiểm tra backend cổng 5000, proxy Vite và `VITE_API_URL`; khởi động lại Vite khi đổi env. |
| API trả 500/503 | Xem log backend, `DATABASE_URL`, quyền kết nối và schema database. |
| Movie hoạt động nhưng Cinema/Room lỗi | Kiểm tra migration và các bảng thực tế `cinemas`, `rooms`; không chỉ tìm tên `Cinema`/`Room`. |
| “No pending migrations” nhưng thiếu bảng | Kiểm tra database đang kết nối và trạng thái lịch sử migration; không suy ra schema đầy đủ chỉ từ thông báo này. |
| Không có phim/suất chiếu/ghế | Migration không tạo dữ liệu mẫu; tạo dữ liệu đúng thứ tự ở mục 8.6. |
| 403 ở Room/Seat | Những API quản lý này, kể cả GET, đang yêu cầu Admin. |
| 409 khi đặt vé | Kiểm tra trạng thái ghế, hold, suất chiếu đã bắt đầu hoặc không còn SCHEDULED. |
| Đổi code nhưng Docker vẫn chạy bản cũ | Rebuild app; Compose hiện không bind-mount source để hot reload. |
| Cổng 3306/5000 bị chiếm | Dừng dịch vụ xung đột hoặc đổi port mapping cùng các URL cấu hình liên quan. |
| Đăng nhập thiếu JWT secret | Cấu hình `JWT_SECRET` và khởi động lại backend. |

Entrypoint hiện có nhánh fallback `db push` khi migration thất bại. Không coi việc app khởi động tiếp là bằng chứng migration đã thành công; cần kiểm tra log và trạng thái schema. Nên hoàn thiện cơ chế dừng khởi động khi migration lỗi trước khi vận hành production.

## 14. Giới hạn và hướng phát triển

### Giới hạn hiện tại

- Màn hình lựa chọn phương thức thanh toán là phần mô phỏng; không thực hiện thu tiền, hoàn tiền hoặc xác minh giao dịch từ cổng thanh toán.
- Ticket có dữ liệu `qrCode` dạng chuỗi `TICKET:<ticketCode>`; không đồng nghĩa đã có hệ thống quét vé và kiểm soát ra vào.
- Chưa có dashboard quản trị frontend và router Ticket độc lập.
- Nút “Continue with Google (Auto Demo)” hiện điền thông tin tài khoản demo; chưa phải Google OAuth. Tài khoản đó cũng không tự được tạo bởi migration.
- Một số nội dung giao diện là placeholder/trang đang phát triển; không xem quảng cáo trên giao diện là bằng chứng đã triển khai voucher, điểm thưởng, ví, ứng dụng mobile hoặc dịch vụ hỗ trợ.
- Cập nhật ghế dùng polling; hết hạn hold xử lý khi có thao tác API liên quan, chưa có scheduler riêng.
- Tạo ghế sau khi suất chiếu đã tồn tại chưa tự đồng bộ ShowtimeSeat. Kiểm thử thay đổi phòng/giá/trạng thái suất chiếu sau khi đã có booking cần được bổ sung.
- Thông báo lỗi chưa thống nhất hoàn toàn về ngôn ngữ và cơ chế xử lý giữa các module.
- Đã có notebook riêng với kết quả tải đọc/đăng nhập và tranh chấp giữ ghế ở mục 12. Tuy nhiên, ZIP mã nguồn chưa kèm notebook hoặc bộ test tự động; kết quả hiện có chưa chứng minh độ tin cậy/hiệu năng toàn hệ thống.

### Định hướng giai đoạn tiếp theo

| Thuộc tính/mục tiêu | Hướng cải tiến | Cách đánh giá |
| --- | --- | --- |
| Nhất quán dữ liệu | Rà soát tranh chấp giữ/đặt/hủy ghế; xử lý retry và idempotency cho yêu cầu tạo booking. | Kiểm thử nhiều tài khoản đồng thời và đối chiếu booking/vé/ghế trong database. |
| Hiệu năng | Đo truy vấn và endpoint chậm, tối ưu index/pool; cân nhắc cache cho dữ liệu đọc ít thay đổi. | So sánh cùng kịch bản trước/sau bằng RPS, P95/P99 và tỷ lệ lỗi. |
| Khả năng bảo trì | Chuẩn hóa ánh xạ lỗi, ranh giới Service/Repository và cấu hình môi trường. | Review thay đổi, typecheck/build và test nghiệp vụ khi refactor. |
| Bảo mật | Rà soát secret, CORS, quyền truy cập, giới hạn request và nội dung log. | Test token sai/hết hạn, tài khoản BLOCKED và truy cập trái quyền. |
| Khả năng quan sát | Bổ sung request ID, log có cấu trúc và health/readiness kiểm tra DB. | Theo dõi một lỗi xuyên suốt các tầng và phát hiện mất kết nối DB. |
| Hoàn thiện sản phẩm | Giao diện quản trị, cổng thanh toán thực tế và luồng soát vé. | Kiểm thử xuyên suốt, kiểm thử tích hợp và xác nhận phạm vi nghiệp vụ mới. |

Ưu tiên cải tiến dựa trên lỗi và số liệu đo được. Mỗi thay đổi nên có phạm vi rõ ràng, baseline, kết quả sau cải tiến và đánh đổi; không coi các hướng trên là cam kết tất cả đã được triển khai.
