export const seatSchemas = {
  Seat: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      roomId: { type: "string", format: "uuid" },
      rowLabel: { type: "string", example: "A" },
      seatNumber: { type: "integer", example: 1 },
      type: { type: "string", enum: ["STANDARD", "VIP", "COUPLE"] },
      active: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  SeatInput: {
    type: "object",
    required: ["roomId", "rowLabel", "seatNumber", "type"],
    properties: {
      roomId: { type: "string", format: "uuid" },
      rowLabel: { type: "string", example: "A" },
      seatNumber: { type: "integer", minimum: 1 },
      type: { type: "string", enum: ["STANDARD", "VIP", "COUPLE"] },
      active: { type: "boolean", default: true },
    },
  },
};
