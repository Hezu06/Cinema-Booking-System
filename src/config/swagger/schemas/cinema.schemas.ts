export const cinemaSchemas = {
  Cinema: {
    type: "object",
    required: [
      "id",
      "name",
      "address",
      "city",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example:
          "3e5468dc-7d02-4b60-a2bf-c23912cfaa11",
      },

      name: {
        type: "string",
        example:
          "CGV Vincom Nguyen Chi Thanh",
      },

      address: {
        type: "string",
        example:
          "54A Nguyen Chi Thanh",
      },

      city: {
        type: "string",
        example: "Hanoi",
      },

      createdAt: {
        type: "string",
        format: "date-time",
        example:
          "2026-09-22T08:00:00.000Z",
      },

      updatedAt: {
        type: "string",
        format: "date-time",
        example:
          "2026-09-22T08:00:00.000Z",
      },
    },
  },

  CreateCinemaInput: {
    type: "object",
    required: [
      "name",
      "address",
      "city",
    ],
    properties: {
      name: {
        type: "string",
        minLength: 1,
        example:
          "CGV Vincom Nguyen Chi Thanh",
      },

      address: {
        type: "string",
        minLength: 1,
        example:
          "54A Nguyen Chi Thanh",
      },

      city: {
        type: "string",
        minLength: 1,
        example: "Hanoi",
      },
    },
  },

  UpdateCinemaInput: {
    type: "object",
    properties: {
      name: {
        type: "string",
        minLength: 1,
        example:
          "CGV Vincom Nguyen Chi Thanh",
      },

      address: {
        type: "string",
        minLength: 1,
        example:
          "54A Nguyen Chi Thanh",
      },

      city: {
        type: "string",
        minLength: 1,
        example: "Hanoi",
      },
    },
  },

  CinemaResponse: {
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
        example: "Cinema created",
      },

      data: {
        $ref:
          "#/components/schemas/Cinema",
      },
    },
  },

  CinemaListResponse: {
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
        example: "Get all cinemas",
      },

      data: {
        type: "array",
        items: {
          $ref:
            "#/components/schemas/Cinema",
        },
      },
    },
  },
};