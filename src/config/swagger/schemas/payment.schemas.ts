export const paymentSchemas = {
  Payment: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      bookingId: { type: "string", format: "uuid" },
      txnRef: { type: "string", example: "PAY-ABC123-12AB34CD" },
      amount: { type: "number", example: 150000 },
      method: { type: "string", enum: ["VNPAY"] },
      status: { type: "string", enum: ["PENDING", "SUCCESS", "FAILED", "EXPIRED", "REFUND_PENDING", "REFUNDED"] },
      transactionNo: { type: "string", nullable: true },
      responseCode: { type: "string", nullable: true },
      refund: { $ref: "#/components/schemas/Refund", nullable: true },
    },
  },
  Refund: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      refundCode: { type: "string", example: "REF-ABC123-12AB34" },
      amount: { type: "number", example: 150000 },
      reason: { type: "string", nullable: true },
      status: { type: "string", enum: ["PENDING", "SUCCESS", "FAILED"] },
      completedAt: { type: "string", format: "date-time", nullable: true },
    },
  },
};
