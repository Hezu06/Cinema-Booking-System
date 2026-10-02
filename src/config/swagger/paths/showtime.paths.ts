const bearer = [{ BearerAuth: [] }];
const idParameter = { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } };

export const showtimePaths = {
  "/api/showtimes": {
    get: {
      tags: ["Showtimes"], summary: "Browse showtimes",
      parameters: ["movieId", "cinemaId", "roomId"].map((name) => ({ name, in: "query", schema: { type: "string", format: "uuid" } })).concat([
        { name: "status", in: "query", schema: { type: "string", enum: ["SCHEDULED", "CANCELLED", "COMPLETED"] } },
        { name: "date", in: "query", schema: { type: "string", format: "date" } },
      ] as never[]),
      responses: { "200": { description: "Showtime list" } },
    },
    post: {
      tags: ["Showtimes"], security: bearer, summary: "Create showtime (Admin)",
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ShowtimeInput" } } } },
      responses: { "201": { description: "Showtime created" }, "409": { description: "Schedule overlap" } },
    },
  },
  "/api/showtimes/{id}": {
    get: { tags: ["Showtimes"], summary: "View showtime details", parameters: [idParameter], responses: { "200": { description: "Showtime" }, "404": { description: "Not found" } } },
    put: {
      tags: ["Showtimes"], security: bearer, summary: "Update showtime (Admin)", parameters: [idParameter],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ShowtimeInput" } } } },
      responses: { "200": { description: "Showtime updated" }, "409": { description: "Schedule overlap or referenced data" } },
    },
    delete: { tags: ["Showtimes"], security: bearer, summary: "Delete showtime (Admin)", parameters: [idParameter], responses: { "200": { description: "Showtime deleted" }, "409": { description: "Referenced by booking data" } } },
  },
  "/api/showtimes/{id}/seats": {
    get: { tags: ["Showtimes"], summary: "View available seats for a showtime", parameters: [idParameter], responses: { "200": { description: "Showtime seat map" }, "404": { description: "Showtime not found" } } },
  },
};
