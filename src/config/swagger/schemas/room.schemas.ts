export const roomSchemas = {
  RoomType: {
    type: "string",
    enum: [
      "STANDARD",
      "VIP",
      "IMAX",
      "THREE_D",
    ],
    example: "STANDARD",
  },

  Room: {
    type: "object",
    required: [
      "id",
      "cinemaId",
      "name",
      "type",
      "capacity",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example:
          "fd2bf81b-c507-4eee-b98c-cf3d4d1123fa",
      },

      cinemaId: {
        type: "string",
        format: "uuid",
        example:
          "3e5468dc-7d02-4b60-a2bf-c23912cfaa11",
      },

      name: {
        type: "string",
        example: "Room 1",
      },

      type: {
        $ref:
          "#/components/schemas/RoomType",
      },

      capacity: {
        type: "integer",
        minimum: 1,
        example: 120,
      },

      createdAt: {
        type: "string",
        format: "date-time",
        example:
          "2026-09-22T08:30:00.000Z",
      },

      updatedAt: {
        type: "string",
        format: "date-time",
        example:
          "2026-09-22T08:30:00.000Z",
      },
    },
  },

  CreateRoomInput: {
    type: "object",
    required: [
      "cinemaId",
      "name",
      "type",
      "capacity",
    ],
    properties: {
      cinemaId: {
        type: "string",
        format: "uuid",
        example:
          "3e5468dc-7d02-4b60-a2bf-c23912cfaa11",
      },

      name: {
        type: "string",
        minLength: 1,
        example: "Room 1",
      },

      type: {
        $ref:
          "#/components/schemas/RoomType",
      },

      capacity: {
        type: "integer",
        minimum: 1,
        example: 120,
      },
    },
  },

  UpdateRoomInput: {
    type: "object",
    properties: {
      cinemaId: {
        type: "string",
        format: "uuid",
        example:
          "3e5468dc-7d02-4b60-a2bf-c23912cfaa11",
      },

      name: {
        type: "string",
        minLength: 1,
        example: "Room 2",
      },

      type: {
        $ref:
          "#/components/schemas/RoomType",
      },

      capacity: {
        type: "integer",
        minimum: 1,
        example: 150,
      },
    },
  },

  RoomResponse: {
    type: "object",
    required: [
      "success",
      "message",
      "data",
    ],
    properties: {
      success: {
        type: "boolean",
        example: true,
      },

      message: {
        type: "string",
        example: "Room created",
      },

      data: {
        $ref:
          "#/components/schemas/Room",
      },
    },
  },

  RoomListResponse: {
    type: "object",
    required: [
      "success",
      "message",
      "data",
    ],
    properties: {
      success: {
        type: "boolean",
        example: true,
      },

      message: {
        type: "string",
        example: "Get all rooms",
      },

      data: {
        type: "array",
        items: {
          $ref:
            "#/components/schemas/Room",
        },
      },
    },
  },
};