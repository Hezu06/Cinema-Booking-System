export const showtimeSchemas = {
  Showtime: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      movieId: { type: "string", format: "uuid" },
      roomId: { type: "string", format: "uuid" },
      startTime: { type: "string", format: "date-time" },
      endTime: { type: "string", format: "date-time" },
      basePrice: { type: "number", format: "double", minimum: 0 },
      status: { type: "string", enum: ["SCHEDULED", "CANCELLED", "COMPLETED"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  ShowtimeInput: {
    type: "object",
    required: ["movieId", "roomId", "startTime", "endTime", "basePrice"],
    properties: {
      movieId: { type: "string", format: "uuid" },
      roomId: { type: "string", format: "uuid" },
      startTime: { type: "string", format: "date-time" },
      endTime: { type: "string", format: "date-time" },
      basePrice: { type: "number", minimum: 0 },
      status: { type: "string", enum: ["SCHEDULED", "CANCELLED", "COMPLETED"] },
    },
  },
  ShowtimeSeat: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      showtimeId: { type: "string", format: "uuid" },
      seatId: { type: "string", format: "uuid" },
      status: { type: "string", enum: ["AVAILABLE", "HELD", "BOOKED"] },
      price: { type: "number" },
      heldByUserId: { type: "string", format: "uuid", nullable: true },
      holdExpiresAt: { type: "string", format: "date-time", nullable: true },
      seat: { $ref: "#/components/schemas/Seat" },
    },
  },
};
