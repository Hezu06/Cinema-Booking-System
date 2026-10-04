const bearer = [{ BearerAuth: [] }];
const idParameter = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
  description: "UUID của đơn đặt vé",
};

export const bookingPaths = {
  "/api/bookings": {
    post: {
      tags: ["Bookings"],
      security: bearer,
      summary: "Đặt vé xem phim (Customer & Admin)",
      description:
        "Đặt một hoặc nhiều ghế trong cùng một suất chiếu. Yêu cầu đăng nhập. Hệ thống tự động kiểm tra trạng thái ghế, tính tổng tiền, tạo mã booking và xuất vé.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BookingInput" },
          },
        },
      },
      responses: {
        "201": {
          description: "Đặt vé thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Booking confirmed successfully" },
                  data: { $ref: "#/components/schemas/BookingDetail" },
                },
              },
            },
          },
        },
        "400": { description: "Dữ liệu không hợp lệ hoặc danh sách ghế trùng" },
        "401": { description: "Chưa đăng nhập (Thiếu Bearer Token)" },
        "404": { description: "Suất chiếu hoặc ghế không tồn tại" },
        "409": { description: "Một hoặc nhiều ghế đã bị khách hàng khác đặt trước đó (Chống Double-Booking)" },
      },
    },
    get: {
      tags: ["Bookings"],
      security: bearer,
      summary: "Danh sách tất cả đơn đặt vé trong hệ thống (Admin only)",
      description: "Quản trị viên tra cứu toàn bộ đơn đặt vé trong hệ thống.",
      parameters: [
        { name: "userId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "showtimeId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"] } },
        { name: "bookingCode", in: "query", schema: { type: "string" } },
      ],
      responses: {
        "200": { description: "Danh sách đơn đặt vé" },
        "401": { description: "Chưa đăng nhập" },
        "403": { description: "Không có quyền (Chỉ dành cho Admin)" },
      },
    },
  },

  "/api/bookings/my-bookings": {
    get: {
      tags: ["Bookings"],
      security: bearer,
      summary: "Xem lịch sử đặt vé của chính mình (Customer & Admin)",
      description: "Lấy toàn bộ danh sách các đơn đặt vé của tài khoản đang đăng nhập.",
      responses: {
        "200": { description: "Lịch sử đặt vé" },
        "401": { description: "Chưa đăng nhập" },
      },
    },
  },

  "/api/bookings/{id}": {
    get: {
      tags: ["Bookings"],
      security: bearer,
      summary: "Xem chi tiết một đơn đặt vé",
      description: "Xem đầy đủ thông tin đơn vé, phim, rạp, phòng, danh sách ghế và vé. Khách hàng chỉ xem được vé của mình; Admin xem được tất cả.",
      parameters: [idParameter],
      responses: {
        "200": { description: "Chi tiết đơn đặt vé" },
        "401": { description: "Chưa đăng nhập" },
        "403": { description: "Không có quyền xem đơn vé của người khác" },
        "404": { description: "Đơn đặt vé không tồn tại" },
      },
    },
  },

  "/api/bookings/{id}/cancel": {
    post: {
      tags: ["Bookings"],
      security: bearer,
      summary: "Hủy đơn đặt vé và tự động giải phóng ghế",
      description:
        "Hủy đơn đặt vé trước giờ chiếu. Hệ thống sẽ đổi trạng thái booking thành CANCELLED và tự động trả các ghế liên quan về trạng thái AVAILABLE.",
      parameters: [idParameter],
      responses: {
        "200": { description: "Hủy vé thành công và đã nhả lại ghế trống" },
        "401": { description: "Chưa đăng nhập" },
        "403": { description: "Không có quyền hủy vé của người khác" },
        "404": { description: "Đơn đặt vé không tồn tại" },
        "409": { description: "Đơn vé đã bị hủy hoặc suất chiếu đã bắt đầu" },
      },
    },
  },
};
