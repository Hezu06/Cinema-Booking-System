export const bookingSchemas = {
  BookingInput: {
    type: "object",
    required: ["showtimeId", "showtimeSeatIds"],
    properties: {
      showtimeId: {
        type: "string",
        format: "uuid",
        description: "UUID của suất chiếu muốn đặt vé",
        example: "57389527-38f3-48b6-89bb-ff315ba69792",
      },
      showtimeSeatIds: {
        type: "array",
        items: {
          type: "string",
          format: "uuid",
        },
        minItems: 1,
        maxItems: 8,
        description: "Danh sách UUID các ghế thuộc suất chiếu này (lấy từ GET /api/showtimes/{id}/seats)",
        example: [
          "8a8ea424-60fe-407b-a63b-2e4adae6ae84",
          "c1310ad8-72e7-4293-8b67-0228a253bdd7",
        ],
      },
    },
  },

  Ticket: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      bookingId: { type: "string", format: "uuid" },
      bookingSeatId: { type: "string", format: "uuid" },
      ticketCode: { type: "string", example: "BK-12345-1" },
      qrCode: { type: "string", example: "TICKET:BK-12345-1" },
      status: { type: "string", enum: ["VALID", "USED", "CANCELLED"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },

  BookingDetail: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      userId: { type: "string", format: "uuid" },
      showtimeId: { type: "string", format: "uuid" },
      bookingCode: { type: "string", example: "BK-12345-ABC" },
      totalAmount: { type: "number", example: 160000 },
      status: {
        type: "string",
        enum: ["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"],
        example: "PENDING",
      },
      expiresAt: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      showtime: { $ref: "#/components/schemas/Showtime" },
      tickets: {
        type: "array",
        items: { $ref: "#/components/schemas/Ticket" },
      },
    },
  },
};
