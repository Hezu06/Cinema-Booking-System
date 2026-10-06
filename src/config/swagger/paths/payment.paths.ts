const bearer = [{ BearerAuth: [] }];

export const paymentPaths = {
  "/api/payments/vnpay/create": {
    post: {
      tags: ["Payments"],
      security: bearer,
      summary: "Tạo URL thanh toán VNPAY Sandbox",
      description: "Số tiền được lấy từ Booking phía server; frontend không được tự gửi số tiền.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["bookingId"],
              properties: {
                bookingId: { type: "string", format: "uuid" },
                bankCode: { type: "string", example: "NCB" },
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Payment URL created" },
        "409": { description: "Booking is not pending or has expired" },
        "503": { description: "VNPAY environment variables are not configured" },
      },
    },
  },
  "/api/payments/booking/{bookingId}": {
    get: {
      tags: ["Payments"],
      security: bearer,
      summary: "Xem các lần thanh toán của Booking",
      parameters: [{ name: "bookingId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: { "200": { description: "Payment attempts" }, "403": { description: "Not booking owner" } },
    },
  },
  "/api/payments/vnpay/ipn": {
    get: {
      tags: ["Payments"],
      summary: "VNPAY server-to-server IPN",
      description: "Public callback protected by VNPAY HMAC-SHA512. Do not call manually in production.",
      responses: { "200": { description: "VNPAY RspCode response" } },
    },
  },
  "/api/payments/vnpay/return": {
    get: {
      tags: ["Payments"],
      summary: "VNPAY browser return URL",
      description: "Verifies signature and redirects to CLIENT_PAYMENT_RESULT_URL; it does not confirm the booking.",
      responses: { "302": { description: "Redirect to frontend result page" } },
    },
  },
};
