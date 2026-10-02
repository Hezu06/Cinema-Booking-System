const bearer = [{ BearerAuth: [] }];
const idParameter = { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } };

export const seatPaths = {
  "/api/seats": {
    get: {
      tags: ["Seats"], security: bearer, summary: "List seats (Admin)",
      parameters: [
        { name: "roomId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "active", in: "query", schema: { type: "boolean" } },
      ],
      responses: { "200": { description: "Seat list" }, "401": { description: "Unauthorized" }, "403": { description: "Admin only" } },
    },
    post: {
      tags: ["Seats"], security: bearer, summary: "Create seat (Admin)",
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SeatInput" } } } },
      responses: { "201": { description: "Seat created" }, "409": { description: "Duplicate position or room capacity reached" } },
    },
  },
  "/api/seats/{id}": {
    get: { tags: ["Seats"], security: bearer, summary: "Get seat (Admin)", parameters: [idParameter], responses: { "200": { description: "Seat" }, "404": { description: "Not found" } } },
    put: {
      tags: ["Seats"], security: bearer, summary: "Update seat (Admin)", parameters: [idParameter],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SeatInput" } } } },
      responses: { "200": { description: "Seat updated" }, "404": { description: "Not found" }, "409": { description: "Conflict" } },
    },
    delete: { tags: ["Seats"], security: bearer, summary: "Delete seat (Admin)", parameters: [idParameter], responses: { "200": { description: "Seat deleted" }, "404": { description: "Not found" }, "409": { description: "Seat is referenced" } } },
  },
};
