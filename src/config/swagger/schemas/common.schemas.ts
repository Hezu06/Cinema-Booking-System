export const commonSchemas = {
  ValidationIssue: {
    type: "object",
    properties: {
      code: {
        type: "string",
        example: "too_small",
      },
      path: {
        type: "array",
        items: {
          oneOf: [
            { type: "string" },
            { type: "integer" },
          ],
        },
        example: ["title"],
      },
      message: {
        type: "string",
        example: "title is required and must not be empty",
      },
    },
  },

  ErrorResponse: {
    type: "object",
    required: ["success", "message"],
    properties: {
      success: {
        type: "boolean",
        example: false,
      },

      message: {
        type: "string",
        example: "Internal server error",
      },

      errors: {
        type: "array",
        items: {
          $ref: "#/components/schemas/ValidationIssue",
        },
      },

      details: {
        type: "string",
        example: "Additional development error details",
      },
    },
  },

  HealthResponse: {
    type: "object",
    required: ["success", "message"],
    properties: {
      success: {
        type: "boolean",
        example: true,
      },

      message: {
        type: "string",
        example: "Cinema Booking System API is running",
      },
    },
  },
};